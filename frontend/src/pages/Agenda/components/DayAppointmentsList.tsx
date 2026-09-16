import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  FileEdit,
  Pencil,
  Plus,
  Repeat,
  User,
  UserX,
  XCircle,
} from 'lucide-react';
import type { Appointment } from '../../../types/appointment';
import {
  AppointmentStatus,
  AppointmentStatusLabels,
} from '../../../types/appointment';
import {
  formatDateFullDescription,
  formatTimeRange,
  getRecurrenceLabel,
} from '../../../utils/formatters';

interface DayAppointmentsListProps {
  selectedDate: string; // YYYY-MM-DD
  appointments: Appointment[];
  loading: boolean;
  onNewAppointment: () => void;
  onEdit: (appointment: Appointment) => void;
  onCancel: (appointment: Appointment) => void;
  onComplete: (id: number) => Promise<void>;
  onNoShow: (id: number) => Promise<void>;
}

export function DayAppointmentsList({
  selectedDate,
  appointments,
  loading,
  onNewAppointment,
  onEdit,
  onCancel,
  onComplete,
  onNoShow,
}: DayAppointmentsListProps) {
  // Filter and sort appointments for the selected date
  const dayAppointments = appointments
    .filter((a) => a.startAt.startsWith(selectedDate))
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );

  const totalCount = dayAppointments.length;
  const activeCount = dayAppointments.filter(
    (a) => a.status !== AppointmentStatus.CANCELLED,
  ).length;

  return (
    <div className="day-appointments-card" id="day-appointments-panel">
      {/* HEADER */}
      <div className="day-appointments-header">
        <div>
          <h4 className="day-appointments-title">Atendimentos do dia</h4>
          <p className="day-appointments-subtitle">
            {formatDateFullDescription(selectedDate)}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onNewAppointment}
          id="btn-new-appointment-day"
        >
          <Plus size={16} />
          <span>Novo atendimento</span>
        </button>
      </div>

      {/* METRICS ROW */}
      <div className="day-metrics-row">
        <span className="day-metric-badge">
          <strong>{totalCount}</strong>{' '}
          {totalCount === 1 ? 'sessão no dia' : 'sessões no dia'}
        </span>
        {activeCount !== totalCount && (
          <span className="day-metric-badge muted">
            {totalCount - activeCount} cancelada(s) (horário liberado)
          </span>
        )}
      </div>

      {/* CONTENT / LIST */}
      {loading ? (
        <div className="agenda-loading-state">
          <div className="spinner" />
          <p>Carregando atendimentos...</p>
        </div>
      ) : dayAppointments.length === 0 ? (
        <div className="agenda-empty-state" id="agenda-empty-state">
          <CalendarClock
            size={40}
            strokeWidth={1.5}
            color="var(--text-secondary)"
          />
          <p className="empty-title">Nenhum atendimento agendado</p>
          <p className="empty-desc">
            Não há consultas agendadas para{' '}
            {formatDateFullDescription(selectedDate)}.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onNewAppointment}
            id="btn-empty-schedule-now"
          >
            <Plus size={16} />
            <span>Agendar para este dia</span>
          </button>
        </div>
      ) : (
        <div className="day-appointments-list" id="day-appointments-list">
          {dayAppointments.map((app) => {
            const isCancelled = app.status === AppointmentStatus.CANCELLED;
            const isCompleted = app.status === AppointmentStatus.COMPLETED;
            const isNoShow = app.status === AppointmentStatus.NO_SHOW;
            const isScheduled = app.status === AppointmentStatus.SCHEDULED;
            const recurrenceLabel = getRecurrenceLabel(app.recurrenceId);

            return (
              <div
                key={app.id}
                className={`appointment-item-card status-${app.status.toLowerCase()}`}
                id={`appointment-item-${app.id}`}
              >
                {/* TIME BADGE */}
                <div className="appointment-time-column">
                  <div className="appointment-time-range">
                    <Clock size={14} />
                    <span>{formatTimeRange(app.startAt, app.endAt)}</span>
                  </div>
                </div>

                {/* PATIENT & DETAILS */}
                <div className="appointment-info-column">
                  <div className="appointment-patient-row">
                    {app.patient ? (
                      <Link
                        to={`/patients/${app.patient.id}`}
                        className="appointment-patient-name"
                        title="Ver ficha do paciente"
                      >
                        <User size={15} />
                        <span>{app.patient.name}</span>
                      </Link>
                    ) : (
                      <span className="appointment-patient-name">
                        <User size={15} />
                        <span>Paciente #{app.patientId}</span>
                      </span>
                    )}

                    <div className="appointment-badges-group">
                      {/* STATUS BADGE */}
                      <span
                        className={`badge appointment-badge-status badge-${app.status.toLowerCase()}`}
                      >
                        {AppointmentStatusLabels[app.status]}
                      </span>

                      {/* RECURRENCE BADGE */}
                      {recurrenceLabel && (
                        <span
                          className="badge badge-recurrence"
                          title={`Sessão da série ${recurrenceLabel}`}
                        >
                          <Repeat size={12} />
                          <span>{recurrenceLabel}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* NOTES */}
                  {app.notes && (
                    <div className="appointment-notes">
                      <p>{app.notes}</p>
                    </div>
                  )}

                  {/* ACTIONS BAR */}
                  <div className="appointment-actions-bar">
                    {/* SCHEDULED ACTIONS */}
                    {isScheduled && (
                      <>
                        <button
                          type="button"
                          className="btn-action btn-action-complete"
                          onClick={() => onComplete(app.id)}
                          title="Marcar consulta como realizada"
                          id={`btn-complete-${app.id}`}
                        >
                          <CheckCircle2 size={14} />
                          <span>Realizado</span>
                        </button>

                        <button
                          type="button"
                          className="btn-action btn-action-noshow"
                          onClick={() => onNoShow(app.id)}
                          title="Marcar como falta"
                          id={`btn-noshow-${app.id}`}
                        >
                          <UserX size={14} />
                          <span>Faltou</span>
                        </button>

                        <button
                          type="button"
                          className="btn-action btn-action-edit"
                          onClick={() => onEdit(app)}
                          title="Remarcar ou editar atendimento"
                          id={`btn-edit-${app.id}`}
                        >
                          <Pencil size={14} />
                          <span>Editar / Remarcar</span>
                        </button>

                        <button
                          type="button"
                          className="btn-action btn-action-cancel"
                          onClick={() => onCancel(app)}
                          title="Cancelar atendimento"
                          id={`btn-cancel-${app.id}`}
                        >
                          <XCircle size={14} />
                          <span>Cancelar</span>
                        </button>
                      </>
                    )}

                    {/* COMPLETED ACTIONS */}
                    {isCompleted && (
                      <>
                        <Link
                          to={`/patients/${app.patientId}/medical-records`}
                          className="btn-action btn-action-record"
                          title="Acessar prontuário"
                        >
                          <FileEdit size={14} />
                          <span>Ver prontuário</span>
                        </Link>
                        <button
                          type="button"
                          className="btn-action btn-action-edit"
                          onClick={() => onEdit(app)}
                          title="Editar informações"
                        >
                          <Pencil size={14} />
                          <span>Editar</span>
                        </button>
                      </>
                    )}

                    {/* CANCELLED ACTIONS */}
                    {isCancelled && (
                      <button
                        type="button"
                        className="btn-action btn-action-edit"
                        onClick={() => onEdit(app)}
                        title="Reativar / Editar atendimento"
                      >
                        <Pencil size={14} />
                        <span>Editar</span>
                      </button>
                    )}

                    {/* NO SHOW ACTIONS */}
                    {isNoShow && (
                      <button
                        type="button"
                        className="btn-action btn-action-edit"
                        onClick={() => onEdit(app)}
                        title="Editar atendimento"
                      >
                        <Pencil size={14} />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
