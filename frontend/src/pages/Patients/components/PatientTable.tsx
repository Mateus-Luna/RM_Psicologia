import { Eye, Pencil, Trash2, Pill, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Patient } from '../../../types/patient';
import { formatCPF, formatDate, formatPhone } from '../../../utils/formatters';

interface PatientTableProps {
  patients: Patient[];
  loading: boolean;
  onInactivate: (patient: Patient) => void;
}

export function PatientTable({
  patients,
  loading,
  onInactivate,
}: PatientTableProps) {
  if (loading) {
    return (
      <div className="table-card" id="patients-table-loading">
        <div className="table-loading">
          <p>Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="table-card" id="patients-table-empty">
        <div className="table-empty">
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
            Nenhum paciente encontrado.
          </p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Cadastre um novo paciente ou ajuste os filtros de busca.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card" id="patients-table-card">
      <div className="table-responsive">
        <table className="table" id="patients-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Nascimento</th>
              <th>Acomp. Médico</th>
              <th>Medicamentos</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => {
              const activeMedications =
                patient.medications?.filter((m) => m.isActive) ?? [];

              return (
                <tr key={patient.id} id={`patient-row-${patient.id}`}>
                  <td>
                    <Link
                      to={`/patients/${patient.id}`}
                      style={{ fontWeight: 600, color: 'var(--primary)' }}
                      title="Ver detalhes do paciente"
                    >
                      {patient.name}
                    </Link>
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
                    {patient.hasMedicalFollowUp ? (
                      <span className="badge badge-primary" title={patient.doctorName ?? undefined}>
                        <Stethoscope size={13} />
                        <span>Sim</span>
                      </span>
                    ) : (
                      <span className="badge badge-muted">Não</span>
                    )}
                  </td>
                  <td>
                    {activeMedications.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {activeMedications.map((m) => (
                          <span
                            key={m.id}
                            className="badge badge-success"
                            title={m.notes ?? undefined}
                          >
                            <Pill size={12} />
                            <span>{m.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Nenhum
                      </span>
                    )}
                  </td>
                  <td>
                    <div
                      className="table-actions"
                      style={{ justifyContent: 'flex-end' }}
                    >
                      <Link
                        to={`/patients/${patient.id}`}
                        className="btn-icon"
                        id={`view-patient-${patient.id}`}
                        title="Ver perfil"
                      >
                        <Eye size={17} />
                      </Link>
                      <Link
                        to={`/patients/${patient.id}/edit`}
                        className="btn-icon"
                        id={`edit-patient-${patient.id}`}
                        title="Editar paciente"
                      >
                        <Pencil size={17} />
                      </Link>
                      <button
                        type="button"
                        className="btn-icon btn-icon-danger"
                        id={`inactivate-patient-${patient.id}`}
                        title="Inativar paciente"
                        onClick={() => onInactivate(patient)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
