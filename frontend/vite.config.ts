import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

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

function apiMockPlugin(): Plugin {
  return {
    name: 'api-mock-plugin',
    configureServer(server) {
      const dbPath = path.resolve(__dirname, '.auth_db.json')

      function getUser() {
        try {
          if (fs.existsSync(dbPath)) {
            return JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
          }
        } catch {
          return null
        }
        return null
      }

      function saveUser(user: Record<string, unknown>) {
        try {
          fs.writeFileSync(dbPath, JSON.stringify(user, null, 2), 'utf-8')
        } catch {
          // ignore write errors
        }
      }

      server.middlewares.use((req, res, next) => {
        const url = req.url || ''

        if (url === '/auth/setup-status' && req.method === 'GET') {
          const user = getUser()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ configured: user !== null }))
          return
        }

        if (url === '/auth/setup' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              const existing = getUser()
              if (existing) {
                res.statusCode = 409
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    message: 'O sistema já está configurado.',
                  }),
                )
                return
              }

              const newUser = {
                id: '1',
                name: data.name || 'Psicólogo',
                password: data.password,
                createdAt: new Date().toISOString(),
              }
              saveUser(newUser)

              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  id: newUser.id,
                  name: newUser.name,
                  createdAt: newUser.createdAt,
                }),
              )
            } catch (err: unknown) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              const msg = err instanceof Error ? err.message : 'Erro na requisição'
              res.end(JSON.stringify({ message: msg }))
            }
          })
          return
        }

        if (url === '/auth/login' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}')
              const existing = getUser()
              if (!existing) {
                res.statusCode = 401
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    message: 'O sistema ainda não foi configurado.',
                  }),
                )
                return
              }

              if (existing.password !== data.password) {
                res.statusCode = 401
                res.setHeader('Content-Type', 'application/json')
                res.end(
                  JSON.stringify({
                    message: 'Senha inválida.',
                  }),
                )
                return
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(
                JSON.stringify({
                  id: existing.id,
                  name: existing.name,
                }),
              )
            } catch (err: unknown) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              const msg = err instanceof Error ? err.message : 'Erro na requisição'
              res.end(JSON.stringify({ message: msg }))
            }
          })
          return
        }

        if (url.startsWith('/patients')) {
          const patientsDbPath = path.resolve(__dirname, '.patients_db.json')
          const getPatients = (): MockPatient[] => {
            try {
              if (fs.existsSync(patientsDbPath)) {
                return JSON.parse(fs.readFileSync(patientsDbPath, 'utf-8'))
              }
            } catch {
              return []
            }
            return []
          }
          const savePatients = (list: MockPatient[]) => {
            try {
              fs.writeFileSync(patientsDbPath, JSON.stringify(list, null, 2), 'utf-8')
            } catch {
              // ignore
            }
          }

          const parsedUrl = new URL(url, 'http://localhost:3000')
          const pathname = parsedUrl.pathname
          const idMatch = pathname.match(/^\/patients\/(\d+)$/)
          const targetId = idMatch ? Number(idMatch[1]) : null

          // GET /patients/:id
          if (targetId && req.method === 'GET') {
            const list = getPatients()
            const found = list.find((p) => p.id === targetId && p.isActive !== false)
            res.setHeader('Content-Type', 'application/json')
            if (!found) {
              res.statusCode = 404
              res.end(JSON.stringify({ message: 'Paciente não encontrado.' }))
            } else {
              res.end(JSON.stringify(found))
            }
            return
          }

          // DELETE /patients/:id
          if (targetId && req.method === 'DELETE') {
            const list = getPatients()
            const idx = list.findIndex((p) => p.id === targetId)
            if (idx === -1) {
              res.statusCode = 404
              res.end(JSON.stringify({ message: 'Paciente não encontrado.' }))
            } else {
              list[idx].isActive = false
              savePatients(list)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(list[idx]))
            }
            return
          }

          // PATCH /patients/:id
          if (targetId && req.method === 'PATCH') {
            let body = ''
            req.on('data', (c) => {
              body += c
            })
            req.on('end', () => {
              const list = getPatients()
              const idx = list.findIndex((p) => p.id === targetId && p.isActive !== false)
              if (idx === -1) {
                res.statusCode = 404
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ message: 'Paciente não encontrado.' }))
                return
              }
              try {
                const data = JSON.parse(body || '{}')
                if (data.cpf && list.some((p) => p.id !== targetId && p.cpf === data.cpf && p.isActive !== false)) {
                  res.statusCode = 409
                  res.setHeader('Content-Type', 'application/json')
                  res.end(
                    JSON.stringify({
                      message: 'Já existe um paciente cadastrado com este CPF.',
                    }),
                  )
                  return
                }

                const currentPatient = list[idx]
                let updatedMedications = currentPatient.medications || []

                if (data.medications !== undefined) {
                  const incomingList = data.medications as Array<{
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

                  // Update or create incoming
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
                  medications: data.medications !== undefined ? updatedMedications : currentPatient.medications,
                  updatedAt: new Date().toISOString(),
                }
                savePatients(list)
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(list[idx]))
              } catch (err: unknown) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                const msg = err instanceof Error ? err.message : 'Erro na requisição'
                res.end(JSON.stringify({ message: msg }))
              }
            })
            return
          }

          // GET /patients
          if (req.method === 'GET') {
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

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(filtered))
            return
          }

          // POST /patients
          if (req.method === 'POST') {
            let body = ''
            req.on('data', (c) => {
              body += c
            })
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}')
                const list = getPatients()
                if (data.cpf && list.some((p) => p.cpf === data.cpf && p.isActive !== false)) {
                  res.statusCode = 409
                  res.setHeader('Content-Type', 'application/json')
                  res.end(
                    JSON.stringify({
                      message: 'Já existe um paciente cadastrado com este CPF.',
                    }),
                  )
                  return
                }

                const newPatient: MockPatient = {
                  id: list.length > 0 ? Math.max(...list.map((p) => p.id || 0)) + 1 : 1,
                  name: data.name,
                  cpf: data.cpf || null,
                  phone: data.phone,
                  birthDate: data.birthDate,
                  treatmentStartDate: data.treatmentStartDate,
                  diagnosticHypothesis: data.diagnosticHypothesis || null,
                  hasMedicalFollowUp: !!data.hasMedicalFollowUp,
                  doctorName: data.doctorName || null,
                  generalNotes: data.generalNotes || null,
                  isActive: true,
                  medications: (data.medications || []).map((m: { name: string; notes?: string; startedAt?: string }, idx: number) => ({
                    id: idx + 1,
                    name: m.name,
                    notes: m.notes || null,
                    isActive: true,
                    startedAt: m.startedAt || new Date().toISOString(),
                    endedAt: null,
                  })),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }

                list.push(newPatient)
                savePatients(list)

                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(newPatient))
              } catch (err: unknown) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                const msg = err instanceof Error ? err.message : 'Erro na requisição'
                res.end(JSON.stringify({ message: msg }))
              }
            })
            return
          }
        }

        if (url === '/users' && req.method === 'GET') {
          const existing = getUser()
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify(
              existing
                ? [
                    {
                      id: existing.id,
                      name: existing.name,
                      createdAt: existing.createdAt,
                    },
                  ]
                : [],
            ),
          )
          return
        }

        next()
      })
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
})

