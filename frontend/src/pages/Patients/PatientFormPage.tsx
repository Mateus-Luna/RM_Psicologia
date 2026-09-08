import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pill, Plus, Stethoscope, Trash2, User } from 'lucide-react';
import axios from 'axios';
import { AppLayout } from '../../components/layout/AppLayout';
import { patientsService } from '../../services/patients.service';
import type {
  CreatePatientPayload,
  Patient,
  UpdatePatientPayload,
} from '../../types/patient';
import {
  cleanCPF,
  cleanPhone,
  formatCPF,
  formatPhone,
  toInputDate,
} from '../../utils/formatters';
import {
  type MedicationFormData,
  MedicationModal,
} from './components/MedicationModal';

export function PatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const patientId = id ? Number(id) : null;
  const navigate = useNavigate();

  // Loading states
  const [loadingPatient, setLoadingPatient] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Basic info fields
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [treatmentStartDate, setTreatmentStartDate] = useState('');

  // Clinical info fields
  const [diagnosticHypothesis, setDiagnosticHypothesis] = useState('');
  const [hasMedicalFollowUp, setHasMedicalFollowUp] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  // Medications list
  const [medications, setMedications] = useState<MedicationFormData[]>([]);
  const [editingMedicationIndex, setEditingMedicationIndex] = useState<
    number | null
  >(null);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);

  // Load existing patient if in edit mode
  useEffect(() => {
    if (!isEditing || !patientId) return;

    async function loadPatient() {
      setLoadingPatient(true);
      setFormError('');

      try {
        const data: Patient = await patientsService.getPatient(patientId!);
        setName(data.name);
        setCpf(data.cpf ? formatCPF(data.cpf) : '');
        setPhone(formatPhone(data.phone));
        setBirthDate(toInputDate(data.birthDate));
        setTreatmentStartDate(toInputDate(data.treatmentStartDate));
        setDiagnosticHypothesis(data.diagnosticHypothesis ?? '');
        setHasMedicalFollowUp(Boolean(data.hasMedicalFollowUp));
        setDoctorName(data.doctorName ?? '');
        setGeneralNotes(data.generalNotes ?? '');

        // Only populate active medications
        const activeMeds = (data.medications || [])
          .filter((m) => m.isActive)
          .map((m) => ({
            id: m.id,
            name: m.name,
            notes: m.notes ?? undefined,
            startedAt: toInputDate(m.startedAt),
          }));
        setMedications(activeMeds);
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : 'Erro ao carregar os dados do paciente.';
        setFormError(Array.isArray(msg) ? msg.join(', ') : String(msg));
      } finally {
        setLoadingPatient(false);
      }
    }

    loadPatient();
  }, [isEditing, patientId]);

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'O nome deve ter pelo menos 2 caracteres.';
    }

    const unmaskedPhone = cleanPhone(phone);
    if (!unmaskedPhone || unmaskedPhone.length < 8) {
      newErrors.phone = 'Informe um telefone válido (mínimo 8 dígitos).';
    }

    if (!birthDate) {
      newErrors.birthDate = 'A data de nascimento é obrigatória.';
    }

    if (!treatmentStartDate) {
      newErrors.treatmentStartDate =
        'A data de início do acompanhamento é obrigatória.';
    }

    const unmaskedCpf = cleanCPF(cpf);
    if (unmaskedCpf && unmaskedCpf.length !== 11) {
      newErrors.cpf = 'O CPF informado deve conter 11 dígitos.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const unmaskedCpf = cleanCPF(cpf);
      const unmaskedPhone = cleanPhone(phone);

      if (isEditing && patientId) {
        const payload: UpdatePatientPayload = {
          name: name.trim(),
          cpf: unmaskedCpf || undefined,
          phone: unmaskedPhone,
          birthDate,
          treatmentStartDate,
          diagnosticHypothesis: diagnosticHypothesis.trim() || undefined,
          hasMedicalFollowUp,
          doctorName: hasMedicalFollowUp ? doctorName.trim() || undefined : undefined,
          generalNotes: generalNotes.trim() || undefined,
          medications: medications.map((m) => ({
            id: m.id,
            name: m.name,
            notes: m.notes,
            startedAt: m.startedAt,
          })),
        };

        await patientsService.updatePatient(patientId, payload);
        navigate(`/patients/${patientId}`);
      } else {
        const payload: CreatePatientPayload = {
          name: name.trim(),
          cpf: unmaskedCpf || undefined,
          phone: unmaskedPhone,
          birthDate,
          treatmentStartDate,
          diagnosticHypothesis: diagnosticHypothesis.trim() || undefined,
          hasMedicalFollowUp,
          doctorName: hasMedicalFollowUp ? doctorName.trim() || undefined : undefined,
          generalNotes: generalNotes.trim() || undefined,
          medications: medications.map((m) => ({
            name: m.name,
            notes: m.notes,
            startedAt: m.startedAt,
          })),
        };

        const created = await patientsService.createPatient(payload);
        navigate(`/patients/${created.id}`);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 409) {
          setFormError('Já existe um paciente cadastrado com este CPF.');
          setErrors((prev) => ({
            ...prev,
            cpf: 'Já existe um paciente cadastrado com este CPF.',
          }));
        } else if (err.response?.data?.message) {
          const msg = err.response.data.message;
          setFormError(Array.isArray(msg) ? msg.join(', ') : String(msg));
        } else {
          setFormError('Não foi possível salvar o paciente. Tente novamente.');
        }
      } else {
        setFormError('Ocorreu um erro inesperado.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaveMedication(medData: MedicationFormData) {
    if (editingMedicationIndex !== null) {
      setMedications((prev) => {
        const updated = [...prev];
        updated[editingMedicationIndex] = medData;
        return updated;
      });
    } else {
      setMedications((prev) => [...prev, medData]);
    }
    setEditingMedicationIndex(null);
  }

  function handleRemoveMedication(indexToRemove: number) {
    setMedications((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  if (loadingPatient) {
    return (
      <AppLayout title={isEditing ? 'Editar Paciente' : 'Novo Paciente'}>
        <div className="page-container">
          <div className="table-card">
            <div className="table-loading">
              <p>Carregando dados do paciente...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={isEditing ? 'Editar Paciente' : 'Novo Paciente'}
      subtitle={
        isEditing
          ? 'Atualize as informações clínicas e cadastrais do paciente.'
          : 'Preencha o formulário para registrar um novo paciente no sistema.'
      }
    >
      <div className="page-container" id="patient-form-page">
        <div className="page-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to={isEditing && patientId ? `/patients/${patientId}` : '/patients'}
              className="btn btn-secondary btn-sm"
              id="back-button"
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </Link>
            <h2>{isEditing ? 'Editar Paciente' : 'Novo Paciente'}</h2>
          </div>
        </div>

        {formError && (
          <div className="alert alert-danger" id="patient-form-error">
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-card">
            {/* DADOS PESSOAIS */}
            <div className="form-section">
              <div className="form-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="var(--primary)" />
                  <span>Dados Pessoais</span>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label htmlFor="patient-name">
                    Nome completo <span className="form-field-required">*</span>
                  </label>
                  <input
                    id="patient-name"
                    type="text"
                    className="form-input"
                    placeholder="Nome do paciente"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  {errors.name && (
                    <span className="form-field-error">{errors.name}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="patient-cpf">CPF (opcional)</label>
                  <input
                    id="patient-cpf"
                    type="text"
                    className="form-input"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                  />
                  {errors.cpf && (
                    <span className="form-field-error">{errors.cpf}</span>
                  )}
                </div>
              </div>

              <div className="form-grid-3">
                <div className="form-field">
                  <label htmlFor="patient-phone">
                    Telefone <span className="form-field-required">*</span>
                  </label>
                  <input
                    id="patient-phone"
                    type="text"
                    className="form-input"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    required
                  />
                  {errors.phone && (
                    <span className="form-field-error">{errors.phone}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="patient-birthdate">
                    Data de nascimento{' '}
                    <span className="form-field-required">*</span>
                  </label>
                  <input
                    id="patient-birthdate"
                    type="date"
                    className="form-input"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    required
                  />
                  {errors.birthDate && (
                    <span className="form-field-error">{errors.birthDate}</span>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="patient-treatment-start">
                    Início do acompanhamento{' '}
                    <span className="form-field-required">*</span>
                  </label>
                  <input
                    id="patient-treatment-start"
                    type="date"
                    className="form-input"
                    value={treatmentStartDate}
                    onChange={(e) => setTreatmentStartDate(e.target.value)}
                    required
                  />
                  {errors.treatmentStartDate && (
                    <span className="form-field-error">
                      {errors.treatmentStartDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* INFORMAÇÕES CLÍNICAS */}
            <div className="form-section">
              <div className="form-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Stethoscope size={18} color="var(--primary)" />
                  <span>Informações Clínicas</span>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="patient-diagnosis">
                  Hipótese diagnóstica
                </label>
                <textarea
                  id="patient-diagnosis"
                  className="form-textarea"
                  placeholder="Ex: Transtorno de ansiedade generalizada (TAG), episódio depressivo..."
                  value={diagnosticHypothesis}
                  onChange={(e) => setDiagnosticHypothesis(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-field">
                <label>Faz acompanhamento com algum médico?</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="hasMedicalFollowUp"
                      value="false"
                      checked={!hasMedicalFollowUp}
                      onChange={() => {
                        setHasMedicalFollowUp(false);
                        setDoctorName('');
                      }}
                    />
                    <span>Não</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="hasMedicalFollowUp"
                      value="true"
                      checked={hasMedicalFollowUp}
                      onChange={() => setHasMedicalFollowUp(true)}
                    />
                    <span>Sim</span>
                  </label>
                </div>
              </div>

              {hasMedicalFollowUp && (
                <div className="form-field">
                  <label htmlFor="patient-doctor-name">
                    Nome do médico / Especialidade
                  </label>
                  <input
                    id="patient-doctor-name"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Dr. Carlos (Psiquiatra), Dra. Helena..."
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* MEDICAMENTOS */}
            <div className="form-section">
              <div className="form-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill size={18} color="var(--primary)" />
                  <span>Medicamentos</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  id="add-medication-button"
                  onClick={() => {
                    setEditingMedicationIndex(null);
                    setIsMedicationModalOpen(true);
                  }}
                >
                  <Plus size={15} />
                  <span>Adicionar medicamento</span>
                </button>
              </div>

              {medications.length === 0 ? (
                <div className="medications-empty" id="medications-empty-box">
                  <Pill size={24} color="var(--text-muted)" />
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--text)' }}>
                      Nenhum medicamento registrado para este paciente.
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Se o paciente fizer uso de medicamentos contínuos ou controlados, adicione-os acima.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="medications-list" id="medications-list">
                  {medications.map((med, index) => (
                    <div
                      key={med.id ? `med-${med.id}` : `new-med-${index}`}
                      className="medication-card"
                    >
                      <div className="medication-info">
                        <span className="medication-name">{med.name}</span>
                        {med.notes && (
                          <span className="medication-notes">{med.notes}</span>
                        )}
                        {med.startedAt && (
                          <span
                            style={{
                              fontSize: '12px',
                              color: 'var(--text-muted)',
                              marginTop: '2px',
                            }}
                          >
                            Início: {med.startedAt}
                          </span>
                        )}
                      </div>

                      <div className="medication-actions">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setEditingMedicationIndex(index);
                            setIsMedicationModalOpen(true);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-icon-danger"
                          title="Remover medicamento"
                          onClick={() => handleRemoveMedication(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OBSERVAÇÕES GERAIS */}
            <div className="form-section">
              <div className="form-section-title">
                <span>Observações Gerais</span>
              </div>

              <div className="form-field">
                <label htmlFor="patient-notes">
                  Observações e anotações cadastrais
                </label>
                <textarea
                  id="patient-notes"
                  className="form-textarea"
                  placeholder="Informações adicionais, preferências, observações sobre o paciente..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '8px',
              }}
            >
              <Link
                to={isEditing && patientId ? `/patients/${patientId}` : '/patients'}
                className="btn btn-secondary"
                id="cancel-form-button"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="btn btn-primary"
                id="submit-patient-button"
                disabled={submitting}
              >
                {submitting
                  ? 'Salvando...'
                  : isEditing
                    ? 'Atualizar Paciente'
                    : 'Cadastrar Paciente'}
              </button>
            </div>
          </div>
        </form>

        <MedicationModal
          isOpen={isMedicationModalOpen}
          initialData={
            editingMedicationIndex !== null
              ? medications[editingMedicationIndex]
              : null
          }
          onClose={() => {
            setIsMedicationModalOpen(false);
            setEditingMedicationIndex(null);
          }}
          onSave={handleSaveMedication}
        />
      </div>
    </AppLayout>
  );
}
