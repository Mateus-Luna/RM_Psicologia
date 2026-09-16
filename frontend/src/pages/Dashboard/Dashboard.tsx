import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays } from 'lucide-react';

import { AppLayout } from '../../components/layout/AppLayout';
import { patientsService } from '../../services/patients.service';
import { appointmentsService } from '../../services/appointments.service';
import { AppointmentStatus } from '../../types/appointment';
import { toInputDate } from '../../utils/formatters';

export function Dashboard() {
  const navigate = useNavigate();
  const [patientCount, setPatientCount] = useState<number | null>(null);
  const [todayAppointmentsCount, setTodayAppointmentsCount] = useState<
    number | null
  >(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const patients = await patientsService.getPatients();
        setPatientCount(patients.length);
      } catch {
        setPatientCount(0);
      }

      try {
        const todayStr = toInputDate(new Date().toISOString());
        const apps = await appointmentsService.getAppointments();
        const count = apps.filter(
          (a) =>
            a.startAt.startsWith(todayStr) &&
            a.status !== AppointmentStatus.CANCELLED,
        ).length;
        setTodayAppointmentsCount(count);
      } catch {
        setTodayAppointmentsCount(0);
      }
    }

    loadStats();
  }, []);

  return (
    <AppLayout>
      <section className="dashboard">
        <div className="dashboard-welcome">
          <h2>Visão geral</h2>

          <p>
            Acompanhe os principais dados do seu consultório.
          </p>
        </div>

        <div className="dashboard-cards">
          <article
            className="dashboard-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/patients')}
            id="dashboard-patients-card"
          >
            <div className="dashboard-card-icon">
              <Users size={24} strokeWidth={1.8} />
            </div>

            <div>
              <span className="dashboard-card-label">
                Pacientes ativos
              </span>

              <strong className="dashboard-card-value">
                {patientCount !== null ? patientCount : '...'}
              </strong>
            </div>
          </article>

          <article
            className="dashboard-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/agenda')}
            id="dashboard-appointments-card"
          >
            <div className="dashboard-card-icon">
              <CalendarDays size={24} strokeWidth={1.8} />
            </div>

            <div>
              <span className="dashboard-card-label">
                Atendimentos hoje
              </span>

              <strong className="dashboard-card-value">
                {todayAppointmentsCount !== null
                  ? todayAppointmentsCount
                  : '...'}
              </strong>
            </div>
          </article>
        </div>
      </section>
    </AppLayout>
  );
}
