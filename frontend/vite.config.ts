import fs from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Connect, type Plugin } from 'vite'

interface MockMedication {
  id?: number
  name: string
  notes?: string | null
  isActive?: boolean
  startedAt?: string
  endedAt?: string | null
}

interface MockPatient {
  id: number
  name: string
  cpf?: string | null
  phone: string
  birthDate: string
  treatmentStartDate: string
  diagnosticHypothesis?: string | null
  hasMedicalFollowUp?: boolean
  doctorName?: string | null
  generalNotes?: string | null
  isActive?: boolean
  medications?: MockMedication[]
  createdAt?: string
  updatedAt?: string
}

interface MockMedicalRecordEntry {
  id: number
  patientId: number
  type: 'APPOINTMENT' | 'GENERAL_NOTE'
  entryDate: string
  content: string
  createdAt: string
  updatedAt: string
}

interface PatientPayload {
  name?: string
  cpf?: string | null
  phone?: string
  birthDate?: string
  treatmentStartDate?: string
  diagnosticHypothesis?: string | null
  hasMedicalFollowUp?: boolean
  doctorName?: string | null
  generalNotes?: string | null
  medications?: Array<{
    id?: number
    name: string
    notes?: string
    startedAt?: string
    endedAt?: string
  }>
}

interface MedicalRecordPayload {
  type?: 'APPOINTMENT' | 'GENERAL_NOTE'
  entryDate?: string
  content?: string
}

interface AuthPayload {
  name?: string
  password?: string
}

function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer | string) => {
      body += chunk
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

function apiMockPlugin(): Plugin {
  const authDbPath = path.resolve(__dirname, '.auth_db.json')
  const patientsDbPath = path.resolve(__dirname, '.patients_db.json')
  const medicalRecordsDbPath = path.resolve(__dirname, '.medical_records_db.json')

  function getUser() {
    try {
      if (fs.existsSync(authDbPath)) {
        return JSON.parse(fs.readFileSync(authDbPath, 'utf-8'))
      }
    } catch {
      return null
    }
    return null
  }

  function saveUser(user: Record<string, unknown>) {
    try {
      fs.writeFileSync(authDbPath, JSON.stringify(user, null, 2), 'utf-8')
    } catch {
      // ignore
    }
  }

  function getPatients(): MockPatient[] {
    try {
      if (fs.existsSync(patientsDbPath)) {
        return JSON.parse(fs.readFileSync(patientsDbPath, 'utf-8'))
      }
    } catch {
      return []
    }
    return []
  }

  function savePatients(list: MockPatient[]) {
    try {
      fs.writeFileSync(patientsDbPath, JSON.stringify(list, null, 2), 'utf-8')
    } catch {
      // ignore
    }
  }

  function getMedicalRecords(): MockMedicalRecordEntry[] {
    try {
      if (fs.existsSync(medicalRecordsDbPath)) {
        return JSON.parse(fs.readFileSync(medicalRecordsDbPath, 'utf-8'))
      }
    } catch {
      return []
    }
    return []
  }

  function saveMedicalRecords(list: MockMedicalRecordEntry[]) {
    try {
      fs.writeFileSync(medicalRecordsDbPath, JSON.stringify(list, null, 2), 'utf-8')
    } catch {
      // ignore
    }
  }

  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    const rawUrl = req.url || ''
    const parsedUrl = new URL(rawUrl, 'http://localhost:3000')
    const pathname = parsedUrl.pathname
    const method = (req.method || 'GET').toUpperCase()

    // 1. AUTH ROUTES
    if (pathname === '/auth/setup-status' && method === 'GET') {
      const user = getUser()
      return sendJson(res, 200, { configured: user !== null })
    }

    if (pathname === '/auth/setup' && method === 'POST') {
      const data = (await parseBody(req)) as AuthPayload
      const existing = getUser()
      if (existing) {
        return sendJson(res, 409, { message: 'O sistema já está configurado.' })
      }
      const newUser = {
        id: '1',
        name: data.name || 'Psicólogo',
        password: data.password,
        createdAt: new Date().toISOString(),
      }
      saveUser(newUser)
      return sendJson(res, 200, {
        id: newUser.id,
        name: newUser.name,
        createdAt: newUser.createdAt,
      })
    }

    if (pathname === '/auth/login' && method === 'POST') {
      const data = (await parseBody(req)) as AuthPayload
      const existing = getUser()
      if (!existing) {
        return sendJson(res, 401, { message: 'O sistema ainda não foi configurado.' })
      }
      if (existing.password !== data.password) {
        return sendJson(res, 401, { message: 'Senha inválida.' })
      }
      return sendJson(res, 200, { id: existing.id, name: existing.name })
    }

    if (pathname === '/users' && method === 'GET') {
      const existing = getUser()
      return sendJson(
        res,
        200,
        existing
          ? [{ id: existing.id, name: existing.name, createdAt: existing.createdAt }]
          : [],
      )
    }

    // 2. MEDICAL RECORDS ROUTES (must match before general patient routes)
    const singleRecordMatch = pathname.match(
      /^\/patients\/(\d+)\/medical-records\/(\d+)\/?$/,
    )
    if (singleRecordMatch) {
      const patientId = Number(singleRecordMatch[1])
      const recordId = Number(singleRecordMatch[2])

      if (method === 'GET') {
        const records = getMedicalRecords()
        const found = records.find(
          (r) => r.id === recordId && r.patientId === patientId,
        )
        if (!found) {
          return sendJson(res, 404, {
            message: 'Registro de prontuário não encontrado.',
          })
        }
        return sendJson(res, 200, found)
      }

      if (method === 'PATCH' || method === 'PUT') {
        const records = getMedicalRecords()
        const idx = records.findIndex(
          (r) => r.id === recordId && r.patientId === patientId,
        )
        if (idx === -1) {
          return sendJson(res, 404, {
            message: 'Registro de prontuário não encontrado.',
          })
        }
        const data = (await parseBody(req)) as MedicalRecordPayload
        records[idx] = {
          ...records[idx],
          ...(data.type !== undefined && { type: data.type }),
          ...(data.entryDate !== undefined && { entryDate: data.entryDate }),
          ...(data.content !== undefined && { content: data.content }),
          updatedAt: new Date().toISOString(),
        }
        saveMedicalRecords(records)
        return sendJson(res, 200, records[idx])
      }

      if (method === 'DELETE') {
        const records = getMedicalRecords()
        const idx = records.findIndex(
          (r) => r.id === recordId && r.patientId === patientId,
        )
        if (idx === -1) {
          return sendJson(res, 404, {
            message: 'Registro de prontuário não encontrado.',
          })
        }
        const [deleted] = records.splice(idx, 1)
        saveMedicalRecords(records)
        return sendJson(res, 200, {
          message: 'Registro de prontuário removido com sucesso.',
          deleted,
        })
      }
    }

    const recordsCollectionMatch = pathname.match(
      /^\/patients\/(\d+)\/medical-records\/?$/,
    )
    if (recordsCollectionMatch) {
      const patientId = Number(recordsCollectionMatch[1])

      if (method === 'GET') {
        const list = getMedicalRecords().filter((r) => r.patientId === patientId)
        const search = parsedUrl.searchParams.get('search')?.toLowerCase()
        const type = parsedUrl.searchParams.get('type')
        const startDate = parsedUrl.searchParams.get('startDate')
        const endDate = parsedUrl.searchParams.get('endDate')

        let filtered = list
        if (search) {
          filtered = filtered.filter((r) =>
            r.content.toLowerCase().includes(search),
          )
        }
        if (type) {
          filtered = filtered.filter((r) => r.type === type)
        }
        if (startDate) {
          filtered = filtered.filter(
            (r) => new Date(r.entryDate) >= new Date(startDate),
          )
        }
        if (endDate) {
          const end = new Date(endDate)
          if (endDate.length <= 10) {
            end.setHours(23, 59, 59, 999)
          }
          filtered = filtered.filter((r) => new Date(r.entryDate) <= end)
        }

        filtered.sort((a, b) => {
          const dateDiff =
            new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
          if (dateDiff !== 0) return dateDiff
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        return sendJson(res, 200, filtered)
      }

      if (method === 'POST') {
        const data = (await parseBody(req)) as MedicalRecordPayload
        if (!data.content || !data.content.trim()) {
          return sendJson(res, 400, {
            message: 'O conteúdo do registro é obrigatório.',
          })
        }

        const records = getMedicalRecords()
        const nextId =
          records.length > 0 ? Math.max(...records.map((r) => r.id || 0)) + 1 : 1
        const newEntry: MockMedicalRecordEntry = {
          id: nextId,
          patientId,
          type: data.type || 'APPOINTMENT',
          entryDate: data.entryDate || new Date().toISOString(),
          content: data.content.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        records.push(newEntry)
        saveMedicalRecords(records)
        return sendJson(res, 201, newEntry)
      }
    }

    // 3. PATIENTS ROUTES
    const singlePatientMatch = pathname.match(/^\/patients\/(\d+)\/?$/)
    if (singlePatientMatch) {
      const targetId = Number(singlePatientMatch[1])

      if (method === 'GET') {
        const list = getPatients()
        const found = list.find((p) => p.id === targetId && p.isActive !== false)
        if (!found) {
          return sendJson(res, 404, { message: 'Paciente não encontrado.' })
        }
        return sendJson(res, 200, found)
      }

      if (method === 'DELETE') {
        const list = getPatients()
        const idx = list.findIndex((p) => p.id === targetId)
        if (idx === -1) {
          return sendJson(res, 404, { message: 'Paciente não encontrado.' })
        }
        list[idx].isActive = false
        list[idx].updatedAt = new Date().toISOString()
        savePatients(list)
        return sendJson(res, 200, list[idx])
      }

      if (method === 'PATCH') {
        const list = getPatients()
        const idx = list.findIndex(
          (p) => p.id === targetId && p.isActive !== false,
        )
        if (idx === -1) {
          return sendJson(res, 404, { message: 'Paciente não encontrado.' })
        }

        const data = (await parseBody(req)) as PatientPayload
        if (
          data.cpf &&
          list.some(
            (p) => p.id !== targetId && p.cpf === data.cpf && p.isActive !== false,
          )
        ) {
          return sendJson(res, 409, {
            message: 'Já existe um paciente cadastrado com este CPF.',
          })
        }

        const currentPatient = list[idx]
        let updatedMedications = currentPatient.medications || []
        if (data.medications !== undefined) {
          const incomingList = (data.medications || []) as Array<{
            id?: number
            name: string
            notes?: string
            startedAt?: string
            endedAt?: string
          }>
          const incomingIds = incomingList
            .filter((m) => m.id !== undefined)
            .map((m) => m.id as number)

          // Inactivate active medications not in incoming list
          updatedMedications = updatedMedications.map((m) => {
            if (m.isActive && m.id && !incomingIds.includes(m.id)) {
              return { ...m, isActive: false, endedAt: new Date().toISOString() }
            }
            return m
          })

          let nextMedId =
            updatedMedications.length > 0
              ? Math.max(...updatedMedications.map((m) => m.id || 0)) + 1
              : 1

          for (const inc of incomingList) {
            if (inc.id !== undefined) {
              const medIdx = updatedMedications.findIndex((m) => m.id === inc.id)
              if (medIdx !== -1) {
                updatedMedications[medIdx] = {
                  ...updatedMedications[medIdx],
                  name: inc.name,
                  notes: inc.notes || null,
                  ...(inc.startedAt ? { startedAt: inc.startedAt } : {}),
                  ...(inc.endedAt ? { endedAt: inc.endedAt } : {}),
                  isActive: true,
                  endedAt: null,
                }
              }
            } else {
              updatedMedications.push({
                id: nextMedId++,
                name: inc.name,
                notes: inc.notes || null,
                isActive: true,
                startedAt: inc.startedAt || new Date().toISOString(),
                endedAt: null,
              })
            }
          }
        }

        list[idx] = {
          ...currentPatient,
          ...data,
          medications:
            data.medications !== undefined
              ? updatedMedications
              : currentPatient.medications,
          updatedAt: new Date().toISOString(),
        }
        savePatients(list)
        return sendJson(res, 200, list[idx])
      }
    }

    if (pathname === '/patients' || pathname === '/patients/') {
      if (method === 'GET') {
        const list = getPatients().filter((p) => p.isActive !== false)
        const search = parsedUrl.searchParams.get('search')?.toLowerCase()
        const hasMedicalFollowUp = parsedUrl.searchParams.get('hasMedicalFollowUp')
        const usesMedication = parsedUrl.searchParams.get('usesMedication')
        const medication = parsedUrl.searchParams.get('medication')?.toLowerCase()

        let filtered = list
        if (search) {
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(search) ||
              (p.cpf && p.cpf.toLowerCase().includes(search)),
          )
        }
        if (hasMedicalFollowUp !== null && hasMedicalFollowUp !== undefined) {
          const boolVal = hasMedicalFollowUp === 'true'
          filtered = filtered.filter((p) => !!p.hasMedicalFollowUp === boolVal)
        }
        if (usesMedication !== null && usesMedication !== undefined) {
          const boolVal = usesMedication === 'true'
          filtered = filtered.filter((p) => {
            const hasActive = p.medications?.some((m) => m.isActive !== false)
            return boolVal ? !!hasActive : !hasActive
          })
        }
        if (medication) {
          filtered = filtered.filter((p) =>
            p.medications?.some(
              (m) =>
                m.isActive !== false &&
                m.name.toLowerCase().includes(medication),
            ),
          )
        }
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        return sendJson(res, 200, filtered)
      }

      if (method === 'POST') {
        const data = (await parseBody(req)) as PatientPayload
        const list = getPatients()
        if (
          data.cpf &&
          list.some((p) => p.cpf === data.cpf && p.isActive !== false)
        ) {
          return sendJson(res, 409, {
            message: 'Já existe um paciente cadastrado com este CPF.',
          })
        }

        const newPatient: MockPatient = {
          id: list.length > 0 ? Math.max(...list.map((p) => p.id || 0)) + 1 : 1,
          name: data.name || '',
          cpf: data.cpf || null,
          phone: data.phone || '',
          birthDate: data.birthDate || '',
          treatmentStartDate: data.treatmentStartDate || '',
          diagnosticHypothesis: data.diagnosticHypothesis || null,
          hasMedicalFollowUp: !!data.hasMedicalFollowUp,
          doctorName: data.doctorName || null,
          generalNotes: data.generalNotes || null,
          isActive: true,
          medications: (data.medications || []).map(
            (
              m: { name: string; notes?: string; startedAt?: string },
              idx: number,
            ) => ({
              id: idx + 1,
              name: m.name,
              notes: m.notes || null,
              isActive: true,
              startedAt: m.startedAt || new Date().toISOString(),
              endedAt: null,
            }),
          ),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        list.push(newPatient)
        savePatients(list)
        return sendJson(res, 201, newPatient)
      }
    }

    next()
  }

  return {
    name: 'api-mock-plugin',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiMockPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
})
