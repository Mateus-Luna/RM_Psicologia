import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Eye,
  Search,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import axios from 'axios';
import { AppLayout } from '../../components/layout/AppLayout';
import { patientsService } from '../../services/patients.service';
import type { Patient } from '../../types/patient';
import { formatCPF, formatDate, formatPhone } from '../../utils/formatters';
import { ActivatePatientModal } from './components/ActivatePatientModal';

export function InactivePatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Activation modal state
  const [patientToActivate, setPatientToActivate] = useState<Patient | null>(null);
  const [activating, setActivating] = useState(false);

  const fetchInactivePatients = useCallback(async (searchTerm: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await patientsService.getInactivePatients({ search: searchTerm });
      setPatients(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Não foi possível carregar a lista de pacientes inativos.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInactivePatients(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, fetchInactivePatients]);

  async function handleConfirmActivate() {
    if (!patientToActivate) return;

    setActivating(true);
    try {
      await patientsService.activatePatient(patientToActivate.id);
      setSuccessMessage('Paciente reativado com sucesso.');
      setPatientToActivate(null);
      await fetchInactivePatients(search);

      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Não foi possível reativar o paciente.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setActivating(false);
    }
  }

  return (
    <AppLayout
      title="Pacientes Inativos"
      subtitle="Histórico de pacientes inativados preservado para consulta e reativação"
    >
      <div className="page-container" id="inactive-patients-page">
        {/* HEADER ROW */}
        <div className="page-header-row">
          <div className="page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserX size={24} color="var(--danger)" />
              <h2>Pacientes Inativos</h2>
            </div>
            <p>
              Pacientes fora do funcionamento normal do consultório. Seus dados, prontuários e medicamentos permanecem intactos.
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS: ATIVOS / INATIVOS */}
        <div className="patient-tabs-nav" style={{ marginBottom: '16px' }} id="patients-view-tabs">
          <Link
            to="/patients"
            className="patient-tab-btn"
            id="tab-active-patients"
          >
            <Users size={16} />
            <span>Pacientes ativos</span>
          </Link>
          <Link
            to="/patients/inactive"
            className="patient-tab-btn active"
            id="tab-inactive-patients"
          >
            <UserX size={16} />
            <span>Pacientes inativos</span>
            {patients.length > 0 && (
              <span className="tab-count-badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                {patients.length}
              </span>
            )}
          </Link>
        </div>

        {/* FEEDBACK BANNERS */}
        {error && (
          <div className="alert alert-danger" id="inactive-patients-error-banner">
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" id="inactive-patients-success-banner">
            <span>{successMessage}</span>
          </div>
        )}

        {/* SEARCH BAR */}
        <div className="filters-card">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              id="search-inactive-patients-input"
              placeholder="Buscar paciente inativo por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="table-card" id="inactive-patients-table-card">
          {loading ? (
            <div className="table-loading">
              <p>Carregando pacientes inativos...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="table-empty">
              <UserX size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                Nenhum paciente inativo encontrado.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {search
                  ? 'Nenhum resultado com o termo pesquisado.'
                  : 'Todos os pacientes cadastrados estão participando ativamente dos fluxos do sistema.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table" id="inactive-patients-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>Nascimento</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} id={`inactive-patient-row-${patient.id}`}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Link
                            to={`/patients/${patient.id}`}
                            style={{ fontWeight: 600, color: 'var(--text)' }}
                            title="Ver histórico do paciente"
                          >
                            {patient.name}
                          </Link>
                          <span
                            className="badge badge-danger"
                            style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              alignSelf: 'flex-start',
                              fontWeight: 700,
                              letterSpacing: '0.4px',
                            }}
                          >
                            INATIVO
                          </span>
                        </div>
                      </td>
                      <td>
                        {patient.cpf ? (
                          formatCPF(patient.cpf)
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>{formatPhone(patient.phone)}</td>
                      <td>{formatDate(patient.birthDate)}</td>
                      <td>
                        <span
                          className="badge badge-danger"
                          style={{
                            fontWeight: 700,
                            letterSpacing: '0.5px',
                            padding: '3px 10px',
                          }}
                        >
                          INATIVO
                        </span>
                      </td>
                      <td>
                        <div
                          className="table-actions"
                          style={{ justifyContent: 'flex-end', gap: '6px' }}
                        >
                          <Link
                            to={`/patients/${patient.id}?tab=prontuario`}
                            className="btn-icon"
                            id={`prontuario-inactive-${patient.id}`}
                            title="Consultar prontuário histórico"
                          >
                            <ClipboardList size={17} />
                          </Link>
                          <Link
                            to={`/patients/${patient.id}`}
                            className="btn-icon"
                            id={`view-inactive-${patient.id}`}
                            title="Ver perfil cadastral"
                          >
                            <Eye size={17} />
                          </Link>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            id={`activate-patient-${patient.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                            }}
                            title="Reativar paciente"
                            onClick={() => setPatientToActivate(patient)}
                          >
                            <UserCheck size={14} />
                            <span>Reativar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ActivatePatientModal
          patient={patientToActivate}
          isOpen={Boolean(patientToActivate)}
          loading={activating}
          onClose={() => setPatientToActivate(null)}
          onConfirm={handleConfirmActivate}
        />
      </div>
    </AppLayout>
  );
}
