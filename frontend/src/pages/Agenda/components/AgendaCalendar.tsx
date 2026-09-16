import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Appointment } from '../../../types/appointment';
import { AppointmentStatus as StatusEnum } from '../../../types/appointment';
import { formatMonthYear, formatTime, toInputDate } from '../../../utils/formatters';

interface AgendaCalendarProps {
  currentYear: number;
  currentMonth: number; // 0-indexed (0 = Jan, 8 = Set)
  selectedDate: string; // YYYY-MM-DD
  appointments: Appointment[];
  onSelectDate: (dateIso: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

interface CalendarDay {
  date: Date;
  dateString: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

export function AgendaCalendar({
  currentYear,
  currentMonth,
  selectedDate,
  appointments,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: AgendaCalendarProps) {
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const todayString = useMemo(() => toInputDate(new Date().toISOString()), []);

  // Map appointments by date (YYYY-MM-DD)
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const app of appointments) {
      const dateKey = toInputDate(app.startAt);
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(app);
    }
    return map;
  }, [appointments]);

  // Generate calendar grid (6 weeks = 42 days)
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const days: CalendarDay[] = [];

    // First day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    // 0 = Sunday, 1 = Monday ... 6 = Saturday
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6, Monday is 0

    // Start from the Monday of the first week
    const startDate = new Date(currentYear, currentMonth, 1 - startDayOfWeek);

    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate() + i,
      );

      const y = dayDate.getFullYear();
      const m = String(dayDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayDate.getDate()).padStart(2, '0');
      const dateString = `${y}-${m}-${d}`;

      days.push({
        date: dayDate,
        dateString,
        isCurrentMonth: dayDate.getMonth() === currentMonth,
        isToday: dateString === todayString,
        isSelected: dateString === selectedDate,
      });
    }

    return days;
  }, [currentYear, currentMonth, selectedDate, todayString]);

  return (
    <div className="agenda-calendar-card" id="agenda-calendar-container">
      {/* CALENDAR HEADER */}
      <div className="agenda-calendar-header">
        <div className="agenda-calendar-title-group">
          <h3 className="agenda-calendar-month-title">
            {formatMonthYear(currentYear, currentMonth)}
          </h3>
        </div>

        <div className="agenda-calendar-nav-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onToday}
            id="agenda-today-btn"
          >
            Hoje
          </button>
          <div className="agenda-calendar-arrows">
            <button
              type="button"
              className="btn-icon"
              onClick={onPrevMonth}
              aria-label="Mês anterior"
              id="agenda-prev-month-btn"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={onNextMonth}
              aria-label="Próximo mês"
              id="agenda-next-month-btn"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* WEEKDAY HEADERS */}
      <div className="agenda-calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="agenda-calendar-weekday-cell">
            {day}
          </div>
        ))}
      </div>

      {/* DAYS GRID */}
      <div className="agenda-calendar-grid">
        {calendarDays.map((day) => {
          const dayAppointments = appointmentsByDate.get(day.dateString) || [];
          const activeAppointments = dayAppointments.filter(
            (a) => a.status !== StatusEnum.CANCELLED,
          );

          return (
            <div
              key={day.dateString}
              className={`agenda-calendar-day-cell ${
                !day.isCurrentMonth ? 'other-month' : ''
              } ${day.isToday ? 'is-today' : ''} ${
                day.isSelected ? 'is-selected' : ''
              }`}
              onClick={() => onSelectDate(day.dateString)}
              id={`calendar-day-${day.dateString}`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectDate(day.dateString);
                }
              }}
            >
              <div className="agenda-day-number-row">
                <span className="agenda-day-number">
                  {day.date.getDate()}
                </span>
                {activeAppointments.length > 0 && (
                  <span className="agenda-day-badge">
                    {activeAppointments.length}
                  </span>
                )}
              </div>

              <div className="agenda-day-events-preview">
                {dayAppointments.slice(0, 3).map((app) => {
                  let statusClass = 'event-pill-scheduled';
                  if (app.status === StatusEnum.COMPLETED) {
                    statusClass = 'event-pill-completed';
                  } else if (app.status === StatusEnum.CANCELLED) {
                    statusClass = 'event-pill-cancelled';
                  } else if (app.status === StatusEnum.NO_SHOW) {
                    statusClass = 'event-pill-noshow';
                  }

                  const patientFirstName =
                    app.patient?.name?.split(' ')[0] || 'Paciente';

                  return (
                    <div
                      key={app.id}
                      className={`agenda-event-pill ${statusClass}`}
                      title={`${formatTime(app.startAt)} - ${app.patient?.name || ''}${app.recurrenceId ? ' (Sessão recorrente)' : ''}`}
                    >
                      <span className="event-pill-time">
                        {formatTime(app.startAt)}
                      </span>
                      <span className="event-pill-name">
                        {patientFirstName}
                      </span>
                    </div>
                  );
                })}
                {dayAppointments.length > 3 && (
                  <span className="agenda-events-more">
                    +{dayAppointments.length - 3} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
