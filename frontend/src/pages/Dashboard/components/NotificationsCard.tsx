import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Cake } from 'lucide-react';
import { notificationsService } from '../../../services/notifications.service';
import type { BirthdayNotification } from '../../../types/notification';

export function NotificationsCard() {
  const [birthdays, setBirthdays] = useState<BirthdayNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBirthdays() {
      try {
        setLoading(true);
        setError(false);
        const data = await notificationsService.getTodayBirthdays();
        if (isMounted) {
          setBirthdays(Array.isArray(data) ? data : []);
        }
      } catch {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBirthdays();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <article
      className="dashboard-notifications-card"
      id="dashboard-notifications-card"
    >
      <div className="notifications-header">
        <div className="notifications-header-title">
          <div className="notifications-header-icon">
            <Bell size={20} strokeWidth={2} />
          </div>
          <h3>Notificações</h3>
        </div>
      </div>

      <div className="notifications-body">
        {loading ? (
          <div className="notifications-loading" id="notifications-loading">
            <div className="spinner-small" />
            <span>Carregando...</span>
          </div>
        ) : error ? (
          <div className="notifications-error" id="notifications-error">
            <span>Não foi possível carregar as notificações.</span>
          </div>
        ) : birthdays.length === 0 ? (
          <div className="notifications-empty" id="notifications-empty">
            <div className="notification-item notification-item-empty">
              <div className="notification-icon birthday-icon">
                <Cake size={18} strokeWidth={2} />
              </div>
              <div className="notification-content">
                <p className="notification-empty-text">
                  Nenhum aniversário hoje.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="notifications-list" id="notifications-list">
            <div
              className="notification-item notification-item-birthday"
              id="birthday-notification-item"
            >
              <div className="notification-icon birthday-icon">
                <Cake size={18} strokeWidth={2} />
              </div>

              <div className="notification-content">
                <h4 className="notification-section-title">
                  {birthdays.length === 1
                    ? 'Aniversário de hoje'
                    : 'Aniversários de hoje'}
                </h4>

                {birthdays.length === 1 ? (
                  <p className="notification-message">
                    Hoje é aniversário de{' '}
                    <Link
                      to={`/patients/${birthdays[0].id}`}
                      className="notification-patient-link"
                      title="Ver prontuário e detalhes do paciente"
                    >
                      {birthdays[0].name}
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="notification-multi-list">
                    <p className="notification-message">
                      Hoje é aniversário de:
                    </p>
                    <ul className="notification-patients-ul">
                      {birthdays.map((patient) => (
                        <li
                          key={patient.id}
                          className="notification-patient-li"
                        >
                          <Link
                            to={`/patients/${patient.id}`}
                            className="notification-patient-link"
                            title="Ver prontuário e detalhes do paciente"
                          >
                            {patient.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
