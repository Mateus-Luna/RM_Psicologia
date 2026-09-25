import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Clock,
  Repeat,
  User,
  X,
} from 'lucide-react';
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentPayload,
  RecurrenceFrequency,
  SeriesEditScope,
  UpdateAppointmentPayload,
} from '../../../types/appointment';
import {
  AppointmentStatus as StatusEnum,
  RecurrenceFrequencyLabels,
} from '../../../types/appointment';
import type { Patient } from '../../../types/patient';
import { patientsService } from '../../../services/patients.service';
import {
  combineDateAndTime,
  formatDate,
  formatTimeRange,
  generateRecurrenceOccurrences,
  getRecurrenceLabel,
  toInputDate,
  toInputTime,
} from '../../../utils/formatters';

export interface AppointmentSaveData {
  isEdit: boolean;
  editScope: SeriesEditScope;
  singlePayload: CreateAppointmentPayload | UpdateAppointmentPayload;
  occurrences?: Array<{ startAt: string; endAt: string }>;
  newStartTime?: string;
  newEndTime?: string;
}

interface AppointmentModalProps {
  isOpen: boolean;
  appointmentToEdit: Appointment | null;
  initialDate?: string; // YYYY-MM-DD
  initialStartTime?: string; // HH:mm
  loading: boolean;
  error?: string;
  onClose: () => void;
  onSave: (data: AppointmentSaveData) => Promise<void>;
}

export function AppointmentModal({
  isOpen,
  appointmentToEdit,
  initialDate,
  initialStartTime,
  loading,
  error: backendError,
  onClose,
  onSave,
}: AppointmentModalProps) {
  if (!isOpen) return null;

  return (
    <AppointmentModalContent
      key={`${appointmentToEdit?.id ?? 'new'}-${initialDate ?? ''}-${initialStartTime ?? ''}`}
      appointmentToEdit={appointmentToEdit}
      initialDate={initialDate}
      initialStartTime={initialStartTime}
      loading={loading}
      backendError={backendError}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

interface AppointmentModalContentProps {
  appointmentToEdit: Appointment | null;
  initialDate?: string;
  initialStartTime?: string;
  loading: boolean;
  backendError?: string;
  onClose: () => void;
  onSave: (data: AppointmentSaveData) => Promise<void>;
}

function AppointmentModalContent({
  appointmentToEdit,
  initialDate,
  initialStartTime,
  loading,
  backendError,
  onClose,
  onSave,
}: AppointmentModalContentProps) {
  const isEditing = Boolean(appointmentToEdit);
  const isPartOfSeries = Boolean(appointmentToEdit?.recurrenceId);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>(
    () => appointmentToEdit?.patientId ?? '',
  );

  const [date, setDate] = useState<string>(() =>
    appointmentToEdit
      ? toInputDate(appointmentToEdit.startAt)
      : initialDate || toInputDate(new Date().toISOString()),
  );

  const [startTime, setStartTime] = useState<string>(() =>
    appointmentToEdit
      ? toInputTime(appointmentToEdit.startAt)
      : initialStartTime || '09:00',
  );

  const [endTime, setEndTime] = useState<string>(() => {
    if (appointmentToEdit) {
      return toInputTime(appointmentToEdit.endAt);
    }
    const start = initialStartTime || '09:00';
    const [h, m] = start.split(':').map(Number);
    const endH = String((h + 1) % 24).padStart(2, '0');
    const endM = String(m).padStart(2, '0');
    return `${endH}:${endM}`;
  });

  const [status, setStatus] = useState<AppointmentStatus>(
    () => appointmentToEdit?.status ?? StatusEnum.SCHEDULED,
  );

  const [notes, setNotes] = useState<string>(
    () => appointmentToEdit?.notes || '',
  );

  // Recurrence for new appointment
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<RecurrenceFrequency>('none');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(12);

  // Edit scope for recurring appointment
  const [editScope, setEditScope] = useState<SeriesEditScope>('this_only');

  const [validationError, setValidationError] = useState('');

  // Fetch patients
  useEffect(() => {
    let isMounted = true;
    async function loadPatients() {
      setLoadingPatients(true);
      try {
        const data = await patientsService.getPatients();
        if (isMounted) {
          setPatients(Array.isArray(data) ? data : []);
        }
      } catch {
        // Ignore error
      } finally {
        if (isMounted) setLoadingPatients(false);
      }
    }

    loadPatients();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleStartTimeChange(newStart: string) {
    setStartTime(newStart);
    if (!newStart) return;

    const [h, m] = newStart.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const endH = String((h + 1) % 24).padStart(2, '0');
      const endM = String(m).padStart(2, '0');
      setEndTime(`${endH}:${endM}`);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');

    if (!selectedPatientId) {
      setValidationError('Por favor, selecione o paciente.');
      return;
    }

    if (!date) {
      setValidationError('Por favor, informe a data do atendimento.');
      return;
    }

    if (!startTime || !endTime) {
      setValidationError('Por favor, preencha os horários de início e término.');
      return;
    }

    if (endTime <= startTime) {
      setValidationError(
        'O horário de término deve ser posterior ao horário de início.',
      );
      return;
    }

    const startAt = combineDateAndTime(date, startTime);
    const endAt = combineDateAndTime(date, endTime);

    if (isEditing && appointmentToEdit) {
      const singlePayload: UpdateAppointmentPayload = {
        startAt,
        endAt,
        status,
        confirmed: true,
        notes: notes.trim() || undefined,
      };

      await onSave({
        isEdit: true,
        editScope,
        singlePayload,
        newStartTime: startTime,
        newEndTime: endTime,
      });
    } else {
      // New Appointment
      const hasRecurrence = recurrenceFrequency !== 'none';
      const recurrenceId = hasRecurrence
        ? `rec_${recurrenceFrequency}_${selectedPatientId}_${Date.now()}`
        : undefined;

      const singlePayload: CreateAppointmentPayload = {
        patientId: Number(selectedPatientId),
        startAt,
        endAt,
        confirmed: true,
        notes: notes.trim() || undefined,
        recurrenceId,
      };

      let occurrences: Array<{ startAt: string; endAt: string }> | undefined =
        undefined;
      if (hasRecurrence) {
        occurrences = generateRecurrenceOccurrences(
          date,
          startTime,
          endTime,
          recurrenceFrequency,
          recurrenceCount,
        );
      }

      await onSave({
        isEdit: false,
        editScope: 'this_only',
        singlePayload,
        occurrences,
      });
    }
  }

  return (
    <div
      className="modal-backdrop"
      id="appointment-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-content modal-content-lg"
        id="appointment-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px' }}
      >
        {/* HEADER */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={22} color="var(--primary)" />
            <h3 id="appointment-modal-title">
              {isEditing ? 'Editar Atendimento' : 'Novo Atendimento'}
            </h3>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Fechar"
            id="close-appointment-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* ALERTS */}
        {validationError && (
          <div className="alert alert-danger" id="appointment-validation-error">
            <span>{validationError}</span>
          </div>
        )}

        {backendError && (
          <div className="alert alert-danger" id="appointment-backend-error">
            <span>{backendError}</span>
          </div>
        )}

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          id="appointment-form"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxHeight: 'calc(90vh - 90px)',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {/* PACIENTE */}
          <div className="form-group">
            <label htmlFor="appointment-patient" className="form-label">
              <User size={15} />
              <span>Paciente *</span>
            </label>
            <select
              id="appointment-patient"
              className="form-select"
              value={selectedPatientId}
              onChange={(e) =>
                setSelectedPatientId(
                  e.target.value ? Number(e.target.value) : '',
                )
              }
              disabled={loading || isEditing}
              required
            >
              <option value="">
                {loadingPatients
                  ? 'Carregando pacientes...'
                  : '-- Selecione um paciente --'}
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* EDIT SCOPE SELECTOR IF IN RECURRING SERIES */}
          {isEditing && isPartOfSeries && (
            <div
              className="recurrence-edit-scope-box"
              id="recurrence-edit-scope-box"
            >
              <div className="recurrence-scope-header">
                <Repeat size={16} color="var(--primary)" />
                <strong>
                  Atendimento recorrente (
                  {getRecurrenceLabel(appointmentToEdit?.recurrenceId)})
                </strong>
              </div>
              <p className="recurrence-scope-question">
                O que você deseja alterar?
              </p>

              <div className="recurrence-radio-options">
                <label className="recurrence-radio-label">
                  <input
                    type="radio"
                    name="editScope"
                    value="this_only"
                    checked={editScope === 'this_only'}
                    onChange={() => setEditScope('this_only')}
                    disabled={loading}
                  />
                  <div className="radio-text-group">
                    <span className="radio-title">
                      Somente esta sessão (Recomendado)
                    </span>
                    <span className="radio-desc">
                      Altera apenas o atendimento de {formatDate(date)}. As
                      demais ocorrências da série continuarão inalteradas.
                    </span>
                  </div>
                </label>

                <label className="recurrence-radio-label">
                  <input
                    type="radio"
                    name="editScope"
                    value="this_and_future"
                    checked={editScope === 'this_and_future'}
                    onChange={() => setEditScope('this_and_future')}
                    disabled={loading}
                  />
                  <div className="radio-text-group">
                    <span className="radio-title">
                      Esta e as próximas sessões
                    </span>
                    <span className="radio-desc">
                      Atualiza o horário desta sessão e de todas as futuras da
                      mesma série. Sessões passadas ou concluídas não serão
                      alteradas.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* DATA E HORÁRIOS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '14px',
            }}
          >
            <div className="form-group">
              <label htmlFor="appointment-date" className="form-label">
                <Calendar size={15} />
                <span>
                  {isEditing && editScope === 'this_and_future'
                    ? 'Data de início *'
                    : 'Data *'}
                </span>
              </label>
              <input
                id="appointment-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading || (isEditing && editScope === 'this_and_future')}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="appointment-start-time" className="form-label">
                <Clock size={15} />
                <span>Início *</span>
              </label>
              <input
                id="appointment-start-time"
                type="time"
                className="form-input"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="appointment-end-time" className="form-label">
                <Clock size={15} />
                <span>Término *</span>
              </label>
              <input
                id="appointment-end-time"
                type="time"
                className="form-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* RECORRÊNCIA NA CRIAÇÃO */}
          {!isEditing && (
            <div className="recurrence-creation-card">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    recurrenceFrequency !== 'none' ? '2fr 1.2fr' : '1fr',
                  gap: '14px',
                }}
              >
                <div className="form-group">
                  <label
                    htmlFor="appointment-recurrence"
                    className="form-label"
                  >
                    <Repeat size={15} />
                    <span>Recorrência</span>
                  </label>
                  <select
                    id="appointment-recurrence"
                    className="form-select"
                    value={recurrenceFrequency}
                    onChange={(e) =>
                      setRecurrenceFrequency(
                        e.target.value as RecurrenceFrequency,
                      )
                    }
                    disabled={loading}
                  >
                    <option value="none">Nenhuma (sessão avulsa)</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quinzenal</option>
                    <option value="every_three_weeks">A cada 3 semanas</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>

                {recurrenceFrequency !== 'none' && (
                  <div className="form-group">
                    <label
                      htmlFor="appointment-recurrence-count"
                      className="form-label"
                    >
                      <span>Total de sessões</span>
                    </label>
                    <select
                      id="appointment-recurrence-count"
                      className="form-select"
                      value={recurrenceCount}
                      onChange={(e) =>
                        setRecurrenceCount(Number(e.target.value))
                      }
                      disabled={loading}
                    >
                      <option value={4}>4 sessões (~1 mês)</option>
                      <option value={8}>8 sessões (~2 meses)</option>
                      <option value={12}>12 sessões (~3 meses)</option>
                      <option value={24}>24 sessões (~6 meses)</option>
                    </select>
                  </div>
                )}
              </div>

              {recurrenceFrequency !== 'none' && (
                <div className="recurrence-info-tip">
                  <AlertCircle size={15} color="var(--primary)" />
                  <p>
                    Serão registradas <strong>{recurrenceCount} sessões</strong>{' '}
                    ({RecurrenceFrequencyLabels[recurrenceFrequency].toLowerCase()}
                    , {formatTimeRange(startTime, endTime)}) a partir de{' '}
                    <strong>{formatDate(date)}</strong>. Cada sessão é
                    independente e poderá ser remarcada ou cancelada
                    individualmente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STATUS SE EDITANDO SESSÃO PONTUAL */}
          {isEditing && editScope === 'this_only' && (
            <div className="form-group">
              <label htmlFor="appointment-status" className="form-label">
                Status
              </label>
              <select
                id="appointment-status"
                className="form-select"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as AppointmentStatus)
                }
                disabled={loading}
              >
                <option value={StatusEnum.SCHEDULED}>Agendado</option>
                <option value={StatusEnum.COMPLETED}>Realizado</option>
                <option value={StatusEnum.CANCELLED}>Cancelado</option>
                <option value={StatusEnum.NO_SHOW}>Faltou</option>
              </select>
            </div>
          )}

          {/* OBSERVAÇÕES */}
          <div className="form-group">
            <label htmlFor="appointment-notes" className="form-label">
              Observações
            </label>
            <textarea
              id="appointment-notes"
              className="form-textarea"
              rows={3}
              placeholder="Ex: foco em técnicas de respiração, acompanhamento de registros, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="modal-footer" style={{ marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
              id="cancel-appointment-modal-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              id="save-appointment-btn"
            >
              {loading
                ? 'Salvando...'
                : isEditing
                  ? editScope === 'this_and_future'
                    ? 'Salvar Série Futura'
                    : 'Salvar Alterações'
                  : recurrenceFrequency !== 'none'
                    ? `Agendar ${recurrenceCount} Sessões`
                    : 'Criar Atendimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
