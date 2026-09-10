import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  FileText,
  Pencil,
  Phone,
  Pill,
  Stethoscope,
  Trash2,
  User,
} from 'lucide-react';
import axios from 'axios';
import { AppLayout } from '../../components/layout/AppLayout';
import { patientsService } from '../../services/patients.service';
import type { Patient } from '../../types/patient';
import { formatCPF, formatDate, formatPhone } from '../../utils/formatters';
import { InactivatePatientModal } from './components/InactivatePatientModal';
import { MedicalRecordSection } from './components/MedicalRecords/MedicalRecordSection';

interface PatientDetailsPageProps {
  defaultTab?: 'prontuario' | 'cadastral';
}

export function PatientDetailsPage({
  defaultTab = 'prontuario',
}: PatientDetailsPageProps) {
  const { id } = useParams<{ id: string }>();
  const patientId = id ? Number(id) : null;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const queryTab = searchParams.get('tab');
  const activeTab: 'prontuario' | 'cadastral' =
    queryTab === 'cadastral' || queryTab === 'prontuario'
      ? queryTab
      : defaultTab;

  const [recordCount, setRecordCount] = useState<number | null>(null);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inactivating, setInactivating] = useState(false);
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false);

  function handleTabChange(tab: 'prontuario' | 'cadastral') {
    setSearchParams({ tab });
  }

  useEffect(() => {
    if (!patientId) return;

    async function loadPatient() {
      setLoading(true);
      setError('');

      try {
        const data = await patientsService.getPatient(patientId!);
        setPatient(data);
      } catch (err: unknown) {
        const msg =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : 'Não foi possível carregar os dados do paciente.';
        setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
      } finally {
        setLoading(false);
      }
    }

    loadPatient();
  }, [patientId]);

  async function handleConfirmInactivate() {
    if (!patient) return;

    setInactivating(true);
    try {
      await patientsService.deletePatient(patient.id);
      setIsInactivateModalOpen(false);
      navigate('/patients');
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Não foi possível inativar o paciente.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setInactivating(false);
    }
  }

  // Calculate age safely without timezone issues
  function getAge(birthDateString?: string): number | null {
    if (!birthDateString) return null;
    const clean = birthDateString.split('T')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) return null;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);

    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const m = today.getMonth() - birthMonth;
    if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
      age--;
    }
    return age;
  }

  if (loading) {
    return (
      <AppLayout title="Detalhes do Paciente">
        <div className="page-container">
          <div className="table-card">
            <div className="table-loading">
              <p>Carregando perfil do paciente...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !patient) {
    return (
      <AppLayout title="Paciente">
        <div className="page-container">
          <div className="alert alert-danger">
            <span>{error || 'Paciente não encontrado.'}</span>
          </div>
          <div>
            <Link to="/patients" className="btn btn-secondary">
              <ArrowLeft size={16} />
              <span>Voltar para lista de pacientes</span>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const age = getAge(patient.birthDate);
  const activeMedications =
    patient.medications?.filter((m) => m.isActive) ?? [];

  return (
    <AppLayout
      title={patient.name}
      subtitle="Prontuário e ficha cadastral do paciente"
    >
      <div className="page-container" id="patient-details-page">
        {/* TOP BAR ACTIONS */}
        <div className="page-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/patients"
              className="btn btn-secondary btn-sm"
              id="back-to-patients-btn"
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2>{patient.name}</h2>
              <span className="badge badge-success">Ativo</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to={`/patients/${patient.id}/edit`}
              className="btn btn-secondary btn-sm"
              id="edit-patient-btn"
            >
              <Pencil size={15} />
              <span>Editar paciente</span>
            </Link>

            <button
              type="button"
              className="btn btn-danger-outline btn-sm"
              id="inactivate-patient-btn"
              onClick={() => setIsInactivateModalOpen(true)}
            >
              <Trash2 size={15} />
              <span>Inativar</span>
            </button>
          </div>
        </div>

        {/* PERSISTENT PATIENT SUMMARY BANNER */}
        <div className="patient-summary-banner" id="patient-summary-banner">
          <div className="summary-banner-item">
            <span className="summary-banner-label">Paciente</span>
            <strong className="summary-banner-value">{patient.name}</strong>
          </div>
          <div className="summary-banner-item">
            <span className="summary-banner-label">CPF</span>
            <span className="summary-banner-value">
              {patient.cpf ? formatCPF(patient.cpf) : 'Não informado'}
            </span>
          </div>
          <div className="summary-banner-item">
            <span className="summary-banner-label">Nascimento</span>
            <span className="summary-banner-value">
              {formatDate(patient.birthDate)}
              {age !== null ? ` (${age} anos)` : ''}
            </span>
          </div>
          <div className="summary-banner-item">
            <span className="summary-banner-label">Telefone</span>
            <span className="summary-banner-value">
              {formatPhone(patient.phone) || '-'}
            </span>
          </div>
          <div className="summary-banner-item">
            <span className="summary-banner-label">Início Acompanhamento</span>
            <span className="summary-banner-value">
              {formatDate(patient.treatmentStartDate)}
            </span>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="patient-tabs-nav" id="patient-tabs-nav">
          <button
            type="button"
            className={`patient-tab-btn ${
              activeTab === 'prontuario' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('prontuario')}
            id="tab-prontuario-btn"
          >
            <ClipboardList size={17} />
            <span>Prontuário</span>
            {recordCount !== null && (
              <span className="tab-count-badge">{recordCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`patient-tab-btn ${
              activeTab === 'cadastral' ? 'active' : ''
            }`}
            onClick={() => handleTabChange('cadastral')}
            id="tab-cadastral-btn"
          >
            <User size={17} />
            <span>Ficha Cadastral</span>
          </button>
        </div>

        {/* TAB 1: PRONTUÁRIO */}
        {activeTab === 'prontuario' && (
          <MedicalRecordSection
            patient={patient}
            onRecordCountChange={setRecordCount}
          />
        )}

        {/* TAB 2: FICHA CADASTRAL */}
        {activeTab === 'cadastral' && (
          <div className="form-card" id="patient-cadastral-details">
            {/* DADOS CADASTRAIS */}
            <div className="form-section">
              <div className="form-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="var(--primary)" />
                  <span>Dados Cadastrais</span>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Nome Completo</span>
                  <span className="detail-value">{patient.name}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">CPF</span>
                  <span className="detail-value">
                    {patient.cpf ? (
                      formatCPF(patient.cpf)
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        Não informado
                      </span>
                    )}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Telefone</span>
                  <span
                    className="detail-value"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Phone size={14} color="var(--text-muted)" />
                    <span>{formatPhone(patient.phone)}</span>
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Data de Nascimento</span>
                  <span
                    className="detail-value"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Calendar size={14} color="var(--text-muted)" />
                    <span>
                      {formatDate(patient.birthDate)}
                      {age !== null ? ` (${age} anos)` : ''}
                    </span>
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Início do Acompanhamento</span>
                  <span
                    className="detail-value"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Calendar size={14} color="var(--text-muted)" />
                    <span>{formatDate(patient.treatmentStartDate)}</span>
                  </span>
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

              <div className="details-grid">
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Hipótese Diagnóstica</span>
                  <span className="detail-value">
                    {patient.diagnosticHypothesis || (
                      <span
                        style={{ color: 'var(--text-muted)', fontWeight: 400 }}
                      >
                        Nenhuma hipótese diagnóstica registrada.
                      </span>
                    )}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Acompanhamento Médico</span>
                  <div style={{ marginTop: '4px' }}>
                    {patient.hasMedicalFollowUp ? (
                      <span className="badge badge-primary">
                        <Stethoscope size={13} />
                        <span>Sim</span>
                      </span>
                    ) : (
                      <span className="badge badge-muted">Não</span>
                    )}
                  </div>
                </div>

                {patient.hasMedicalFollowUp && (
                  <div className="detail-item">
                    <span className="detail-label">Médico / Especialidade</span>
                    <span className="detail-value">
                      {patient.doctorName || (
                        <span style={{ color: 'var(--text-muted)' }}>
                          Não especificado
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* MEDICAMENTOS */}
            <div className="form-section">
              <div className="form-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Pill size={18} color="var(--primary)" />
                  <span>Medicamentos em Uso</span>
                </div>
              </div>

              {activeMedications.length === 0 ? (
                <div className="medications-empty" id="details-medications-empty">
                  <Pill size={22} color="var(--text-muted)" />
                  <span>Nenhum medicamento cadastrado para este paciente.</span>
                </div>
              ) : (
                <div className="medications-list" id="details-medications-list">
                  {activeMedications.map((med) => (
                    <div key={med.id} className="medication-card">
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
                            Início do uso: {formatDate(med.startedAt)}
                          </span>
                        )}
                      </div>
                      <span className="badge badge-success">Ativo</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OBSERVAÇÕES GERAIS */}
            <div className="form-section">
              <div className="form-section-title">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--primary)" />
                  <span>Observações Gerais</span>
                </div>
              </div>

              <div
                style={{
                  color: 'var(--text)',
                  fontSize: '14px',
                  lineHeight: '1.6',
                }}
              >
                {patient.generalNotes ? (
                  <p style={{ whiteSpace: 'pre-line' }}>{patient.generalNotes}</p>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Nenhuma observação geral registrada.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <InactivatePatientModal
          patient={patient}
          isOpen={isInactivateModalOpen}
          loading={inactivating}
          onClose={() => setIsInactivateModalOpen(false)}
          onConfirm={handleConfirmInactivate}
        />
      </div>
    </AppLayout>
  );
}
