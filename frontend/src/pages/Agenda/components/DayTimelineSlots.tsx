import { useMemo } from 'react';
import { CalendarPlus, Clock, Repeat, User } from 'lucide-react';
import type { Appointment } from '../../../types/appointment';
import { AppointmentStatus } from '../../../types/appointment';
import { formatTime, getRecurrenceLabel } from '../../../utils/formatters';

interface DayTimelineSlotsProps {
  selectedDate: string; // YYYY-MM-DD
  appointments: Appointment[];
  onSelectSlot: (time: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
}

interface SlotInfo {
  hourString: string; // "08:00"
  hourNumber: number;
  appointment?: Appointment;
  isAvailable: boolean;
}

export function DayTimelineSlots({
  selectedDate,
  appointments,
  onSelectSlot,
  onSelectAppointment,
}: DayTimelineSlotsProps) {
  // Typical working hours: 08:00 to 19:00
  const hours = useMemo(
    () => [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    [],
  );

  const dayAppointments = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.startAt.startsWith(selectedDate) &&
          a.status !== AppointmentStatus.CANCELLED,
      ),
    [appointments, selectedDate],
  );

  const slots = useMemo<SlotInfo[]>(() => {
    return hours.map((h) => {
      const hourString = `${String(h).padStart(2, '0')}:00`;
      const slotStartTime = new Date(`${selectedDate}T${hourString}:00`).getTime();
      const slotEndTime = slotStartTime + 60 * 60 * 1000;

      // Find appointment that overlaps with this slot
      const matchedApp = dayAppointments.find((a) => {
        const aStart = new Date(a.startAt).getTime();
        const aEnd = new Date(a.endAt).getTime();
        return (
          (aStart >= slotStartTime && aStart < slotEndTime) ||
          (aEnd > slotStartTime && aEnd <= slotEndTime) ||
          (aStart <= slotStartTime && aEnd >= slotEndTime)
        );
      });

      return {
        hourString,
        hourNumber: h,
        appointment: matchedApp,
        isAvailable: !matchedApp,
      };
    });
  }, [hours, dayAppointments, selectedDate]);

  const availableCount = slots.filter((s) => s.isAvailable).length;
  const occupiedCount = slots.length - availableCount;

  return (
    <div className="day-timeline-card" id="day-timeline-slots">
      <div className="day-timeline-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="var(--primary)" />
          <h5 className="day-timeline-title">
            Grade de Horários do Dia
          </h5>
        </div>

        <div className="day-timeline-legend">
          <span className="legend-item">
            <span className="legend-dot available" />
            <span>{availableCount} livres</span>
          </span>
          <span className="legend-item">
            <span className="legend-dot occupied" />
            <span>{occupiedCount} ocupados</span>
          </span>
        </div>
      </div>

      <div className="day-timeline-grid">
        {slots.map((slot) => {
          if (slot.isAvailable) {
            return (
              <div
                key={slot.hourString}
                className="timeline-slot slot-available"
                onClick={() => onSelectSlot(slot.hourString)}
                title={`Clique para agendar às ${slot.hourString}`}
              >
                <div className="slot-time-label">{slot.hourString}</div>
                <div className="slot-content">
                  <span className="slot-badge-available">Disponível</span>
                </div>
                <button
                  type="button"
                  className="btn-slot-add"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSlot(slot.hourString);
                  }}
                  title={`Agendar às ${slot.hourString}`}
                >
                  <CalendarPlus size={14} />
                  <span>Agendar</span>
                </button>
              </div>
            );
          }

          const app = slot.appointment!;
          return (
            <div
              key={slot.hourString}
              className={`timeline-slot slot-occupied status-${app.status.toLowerCase()}`}
              onClick={() => onSelectAppointment(app)}
              title="Clique para ver ou editar detalhes deste atendimento"
            >
              <div className="slot-time-label">
                {formatTime(app.startAt)}
              </div>
              <div className="slot-content">
                <div className="slot-patient-name">
                  <User size={13} />
                  <span>{app.patient?.name || `Paciente #${app.patientId}`}</span>
                </div>
                <div className="slot-meta">
                  <span className="slot-badge-occupied">Ocupado</span>
                  {app.recurrenceId && (
                    <span className="slot-badge-recurrence" title="Sessão recorrente">
                      <Repeat size={11} /> {getRecurrenceLabel(app.recurrenceId)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
