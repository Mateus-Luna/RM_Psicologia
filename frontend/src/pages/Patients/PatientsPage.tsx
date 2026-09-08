import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import axios from 'axios';
import { AppLayout } from '../../components/layout/AppLayout';
import { patientsService } from '../../services/patients.service';
import type { Patient, PatientFilters as PatientFiltersType } from '../../types/patient';
import { PatientFilters } from './components/PatientFilters';
import { PatientTable } from './components/PatientTable';
import { InactivatePatientModal } from './components/InactivatePatientModal';

export function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [filters, setFilters] = useState<PatientFiltersType>({
    search: '',
    hasMedicalFollowUp: '',
    usesMedication: '',
    medication: '',
  });

  // Inactivation modal state
  const [patientToInactivate, setPatientToInactivate] = useState<Patient | null>(null);
  const [inactivating, setInactivating] = useState(false);

  const fetchPatients = useCallback(async (currentFilters: PatientFiltersType) => {
    setLoading(true);
    setError('');

    try {
      const data = await patientsService.getPatients(currentFilters);
      setPatients(data);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Não foi possível carregar a lista de pacientes.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search when user types, immediate for selects
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(filters);
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, fetchPatients]);

  function handleClearFilters() {
    setFilters({
      search: '',
      hasMedicalFollowUp: '',
      usesMedication: '',
      medication: '',
    });
  }

  async function handleConfirmInactivate() {
    if (!patientToInactivate) return;

    setInactivating(true);
    try {
      await patientsService.deletePatient(patientToInactivate.id);
      setSuccessMessage(`Paciente ${patientToInactivate.name} inativado com sucesso.`);
      setPatientToInactivate(null);
      await fetchPatients(filters);

      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
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

  return (
    <AppLayout title="Pacientes" subtitle="Gerenciamento clínico e cadastral">
      <div className="page-container" id="patients-page">
        <div className="page-header-row">
          <div className="page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={24} color="var(--primary)" />
              <h2>Pacientes</h2>
            </div>
            <p>Listagem completa e acompanhamento terapêutico.</p>
          </div>

          <Link
            to="/patients/new"
            className="btn btn-primary"
            id="new-patient-button"
          >
            <Plus size={18} />
            <span>Novo paciente</span>
          </Link>
        </div>

        {error && (
          <div className="alert alert-danger" id="patients-error-banner">
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" id="patients-success-banner">
            <span>{successMessage}</span>
          </div>
        )}

        <PatientFilters
          filters={filters}
          onChange={setFilters}
          onClear={handleClearFilters}
        />

        <PatientTable
          patients={patients}
          loading={loading}
          onInactivate={(patient) => setPatientToInactivate(patient)}
        />

        <InactivatePatientModal
          patient={patientToInactivate}
          isOpen={Boolean(patientToInactivate)}
          loading={inactivating}
          onClose={() => setPatientToInactivate(null)}
          onConfirm={handleConfirmInactivate}
        />
      </div>
    </AppLayout>
  );
}
