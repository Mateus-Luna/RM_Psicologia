import { Users, CalendarDays } from 'lucide-react';

import { AppLayout } from '../../components/layout/AppLayout';

export function Dashboard() {
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
          <article className="dashboard-card">
            <div className="dashboard-card-icon">
              <Users size={24} strokeWidth={1.8} />
            </div>

            <div>
              <span className="dashboard-card-label">
                Pacientes
              </span>

              <strong className="dashboard-card-value">
                0
              </strong>
            </div>
          </article>

          <article className="dashboard-card">
            <div className="dashboard-card-icon">
              <CalendarDays size={24} strokeWidth={1.8} />
            </div>

            <div>
              <span className="dashboard-card-label">
                Atendimentos hoje
              </span>

              <strong className="dashboard-card-value">
                0
              </strong>
            </div>
          </article>
        </div>
      </section>
    </AppLayout>
  );
}