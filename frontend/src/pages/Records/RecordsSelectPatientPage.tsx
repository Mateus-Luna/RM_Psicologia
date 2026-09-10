import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search, User, Users } from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { patientsService } from '../../services/patients.service';
import type { Patient } from '../../types/patient';
import { formatCPF, formatDate, formatPhone } from '../../utils/formatters';

export function RecordsSelectPatientPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await patientsService.getPatients();
        setPatients(Array.isArray(data) ? data : []);
      } catch {
        setError('Não foi possível carregar a lista de pacientes.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const patientList = Array.isArray(patients) ? patients : [];
  const filteredPatients = patientList.filter((p) => {
    if (!p) return false;
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.cpf && p.cpf.includes(term.replace(/\D/g, '')))
    );
  });

  return (
    <AppLayout
      title="Prontuários Clínicos"
      subtitle="Selecione um paciente para visualizar ou adicionar registros ao prontuário"
    >
      <div className="page-container" id="records-select-patient-page">
        {/* TOP SEARCH CARD */}
        <div className="filters-card">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              id="records-patient-search-input"
              placeholder="Buscar paciente por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* FEEDBACK */}
        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        {/* PATIENT LIST TABLE */}
        <div className="table-card">
          {loading ? (
            <div className="table-loading">
              <p>Carregando pacientes...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="table-empty">
              <Users size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                Nenhum paciente encontrado.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {search ? 'Tente buscar com outros termos.' : 'Cadastre pacientes para gerenciar seus prontuários.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>Início do Acompanhamento</th>
                    <th style={{ textAlign: 'right' }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.id} id={`record-patient-row-${patient.id}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={16} color="var(--primary)" />
                          <strong style={{ color: 'var(--text)' }}>
                            {patient.name}
                          </strong>
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
                      <td>{formatDate(patient.treatmentStartDate)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/patients/${patient.id}?tab=prontuario`}
                          className="btn btn-primary btn-sm"
                          id={`open-record-${patient.id}-btn`}
                          title={`Abrir prontuário de ${patient.name}`}
                        >
                          <FileText size={15} />
                          <span>Acessar Prontuário</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
