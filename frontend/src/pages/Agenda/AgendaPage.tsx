import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { appointmentsService } from '../../services/appointments.service';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentPayload,
  FindAppointmentsParams,
  SeriesCancelScope,
  UpdateAppointmentPayload,
} from '../../types/appointment';
import { toInputDate } from '../../utils/formatters';
import { AgendaCalendar } from './components/AgendaCalendar';
import { DayAppointmentsList } from './components/DayAppointmentsList';
import { DayTimelineSlots } from './components/DayTimelineSlots';
import type { AppointmentSaveData } from './components/AppointmentModal';
import { AppointmentModal } from './components/AppointmentModal';
import { CancelAppointmentModal } from './components/CancelAppointmentModal';

export function AgendaPage() {
  // Calendar navigation state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [selectedDate, setSelectedDate] = useState(() =>
    toInputDate(today.toISOString()),
  );

  // Active sub-view for the right panel: 'list' | 'timeline'
  const [activeTab, setActiveTab] = useState<'list' | 'timeline'>('list');

  // Search and status filter
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] =
    useState<Appointment | null>(null);
  const [modalInitialTime, setModalInitialTime] = useState<string | undefined>(
    undefined,
  );
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Cancel modal state
  const [appointmentToCancel, setAppointmentToCancel] =
    useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params: FindAppointmentsParams = {};

      if (statusFilter !== 'ALL') {
        params.status = statusFilter as AppointmentStatus;
      }

      if (searchFilter.trim()) {
        params.patientName = searchFilter.trim();
      }

      const data = await appointmentsService.getAppointments(params);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Não foi possível carregar os agendamentos.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchFilter]);

  // Load appointments whenever filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAppointments();
    }, 200);

    return () => clearTimeout(timer);
  }, [fetchAppointments]);

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage('');
    }, 4500);
  }

  // Calendar controls
  function handlePrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleToday() {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(toInputDate(now.toISOString()));
  }

  function handleSelectDate(dateIso: string) {
    setSelectedDate(dateIso);
    const parts = dateIso.split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const monthZeroIndexed = Number(parts[1]) - 1;
      if (year !== currentYear || monthZeroIndexed !== currentMonth) {
        setCurrentYear(year);
        setCurrentMonth(monthZeroIndexed);
      }
    }
  }

  // Modal open helpers
  function handleOpenNewAppointment(initialTime?: string) {
    setAppointmentToEdit(null);
    setModalInitialTime(initialTime);
    setModalError('');
    setIsModalOpen(true);
  }

  function handleOpenEditAppointment(appointment: Appointment) {
    setAppointmentToEdit(appointment);
    setModalInitialTime(undefined);
    setModalError('');
    setIsModalOpen(true);
  }

  // Save (Create or Update with Recurrence Support)
  async function handleSaveAppointment(data: AppointmentSaveData) {
    setModalSaving(true);
    setModalError('');

    try {
      if (data.isEdit && appointmentToEdit) {
        if (
          data.editScope === 'this_and_future' &&
          appointmentToEdit.recurrenceId
        ) {
          // Atualiza o horário desta e de todas as sessões futuras da série
          await appointmentsService.updateSeriesFutureTime(
            appointmentToEdit.recurrenceId,
            appointmentToEdit.startAt,
            data.newStartTime || '09:00',
            data.newEndTime || '10:00',
            appointments,
          );

          if (data.singlePayload.notes !== undefined) {
            await appointmentsService.updateAppointment(appointmentToEdit.id, {
              notes: data.singlePayload.notes,
            });
          }

          showSuccess(
            'Horário atualizado para esta e todas as sessões futuras da série!',
          );
        } else {
          // Somente esta sessão pontual
          await appointmentsService.updateAppointment(
            appointmentToEdit.id,
            data.singlePayload as UpdateAppointmentPayload,
          );
          showSuccess('Atendimento atualizado com sucesso!');
        }
      } else {
        // Nova sessão / série
        if (data.occurrences && data.occurrences.length > 1) {
          await appointmentsService.createRecurrenceSeries(
            data.singlePayload as CreateAppointmentPayload,
            data.occurrences,
          );
          showSuccess(
            `${data.occurrences.length} sessões recorrentes agendadas com sucesso!`,
          );
        } else {
          await appointmentsService.createAppointment(
            data.singlePayload as CreateAppointmentPayload,
          );
          showSuccess('Atendimento agendado com sucesso!');
        }
      }

      setIsModalOpen(false);
      setAppointmentToEdit(null);
      await fetchAppointments();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Não foi possível salvar o agendamento.';
      setModalError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setModalSaving(false);
    }
  }

  // Action: Complete
  async function handleComplete(id: number) {
    try {
      await appointmentsService.completeAppointment(id);
      showSuccess('Atendimento marcado como realizado!');
      await fetchAppointments();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Erro ao concluir atendimento.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  }

  // Action: No-Show
  async function handleNoShow(id: number) {
    try {
      await appointmentsService.markAppointmentAsNoShow(id);
      showSuccess('Falta do paciente registrada!');
      await fetchAppointments();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Erro ao registrar falta.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  }

  // Action: Cancel with Recurrence Scope
  function handleOpenCancelModal(appointment: Appointment) {
    setAppointmentToCancel(appointment);
  }

  async function handleConfirmCancel(scope: SeriesCancelScope) {
    if (!appointmentToCancel) return;
    setCancelling(true);

    try {
      if (scope === 'this_and_future' && appointmentToCancel.recurrenceId) {
        await appointmentsService.cancelSeriesFuture(
          appointmentToCancel.recurrenceId,
          appointmentToCancel.startAt,
          appointments,
        );
        showSuccess(
          'Esta e todas as sessões futuras da série foram canceladas. Os horários foram liberados.',
        );
      } else {
        await appointmentsService.cancelAppointment(appointmentToCancel.id);
        showSuccess(
          'Atendimento cancelado com sucesso. O horário foi liberado.',
        );
      }

      setAppointmentToCancel(null);
      await fetchAppointments();
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Erro ao cancelar atendimento.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <AppLayout
      title="Agenda"
      subtitle="Controle e acompanhamento de atendimentos clínicos"
    >
      <div className="page-container" id="agenda-page">
        {/* PAGE HEADER */}
        <div className="page-header-row">
          <div className="page-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarDays size={24} color="var(--primary)" />
              <h2>Agenda de Atendimentos</h2>
            </div>
            <p>Gerencie suas sessões, horários disponíveis e acompanhamento.</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fetchAppointments()}
              title="Atualizar agenda"
              id="refresh-agenda-btn"
            >
              <RefreshCw size={15} />
              <span>Atualizar</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleOpenNewAppointment()}
              id="new-appointment-main-btn"
            >
              <CalendarPlus size={18} />
              <span>Novo atendimento</span>
            </button>
          </div>
        </div>

        {/* FEEDBACK BANNERS */}
        {error && (
          <div className="alert alert-danger" id="agenda-error-banner">
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success" id="agenda-success-banner">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* FILTERS TOOLBAR */}
        <div className="agenda-toolbar-card" id="agenda-filter-toolbar">
          <div className="agenda-search-input-wrapper">
            <Search size={16} className="agenda-search-icon" />
            <input
              type="text"
              placeholder="Buscar por paciente na agenda..."
              className="form-input agenda-search-input"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              id="search-patient-agenda-input"
            />
            {searchFilter && (
              <button
                type="button"
                className="btn-icon btn-sm"
                onClick={() => setSearchFilter('')}
                title="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          <div className="agenda-filter-select-wrapper">
            <Filter size={16} className="agenda-filter-icon" />
            <select
              className="form-select agenda-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              id="status-filter-select"
            >
              <option value="ALL">Todos os status</option>
              <option value="SCHEDULED">Apenas Agendados</option>
              <option value="COMPLETED">Apenas Realizados</option>
              <option value="CANCELLED">Apenas Cancelados</option>
              <option value="NO_SHOW">Apenas Faltas</option>
            </select>
          </div>
        </div>

        {/* MAIN AGENDA CONTENT: TWO COLUMNS */}
        <div className="agenda-layout-grid">
          {/* LEFT: MONTH CALENDAR */}
          <div className="agenda-calendar-column">
            <AgendaCalendar
              currentYear={currentYear}
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              appointments={appointments}
              onSelectDate={handleSelectDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onToday={handleToday}
            />
          </div>

          {/* RIGHT: DAY DETAILS & SLOTS */}
          <div className="agenda-details-column">
            {/* VIEW SWITCHER TABS */}
            <div className="agenda-view-tabs" id="agenda-view-tabs">
              <button
                type="button"
                className={`agenda-tab-btn ${activeTab === 'list' ? 'active' : ''}`}
                onClick={() => setActiveTab('list')}
                id="tab-day-list"
              >
                <CalendarDays size={16} />
                <span>Atendimentos do dia</span>
              </button>

              <button
                type="button"
                className={`agenda-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
                id="tab-day-timeline"
              >
                <Clock size={16} />
                <span>Horários e Disponibilidade</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'list' ? (
              <DayAppointmentsList
                selectedDate={selectedDate}
                appointments={appointments}
                loading={loading}
                onNewAppointment={() => handleOpenNewAppointment()}
                onEdit={handleOpenEditAppointment}
                onCancel={handleOpenCancelModal}
                onComplete={handleComplete}
                onNoShow={handleNoShow}
              />
            ) : (
              <DayTimelineSlots
                selectedDate={selectedDate}
                appointments={appointments}
                onSelectSlot={(time) => handleOpenNewAppointment(time)}
                onSelectAppointment={handleOpenEditAppointment}
              />
            )}
          </div>
        </div>

        {/* MODAL: CREATE / EDIT */}
        <AppointmentModal
          isOpen={isModalOpen}
          appointmentToEdit={appointmentToEdit}
          initialDate={selectedDate}
          initialStartTime={modalInitialTime}
          loading={modalSaving}
          error={modalError}
          onClose={() => {
            setIsModalOpen(false);
            setAppointmentToEdit(null);
          }}
          onSave={handleSaveAppointment}
        />

        {/* MODAL: CANCEL */}
        <CancelAppointmentModal
          isOpen={Boolean(appointmentToCancel)}
          appointment={appointmentToCancel}
          loading={cancelling}
          onClose={() => setAppointmentToCancel(null)}
          onConfirm={handleConfirmCancel}
        />
      </div>
    </AppLayout>
  );
}
