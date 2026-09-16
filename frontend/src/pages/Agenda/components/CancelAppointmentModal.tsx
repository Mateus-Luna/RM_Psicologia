import { useState } from 'react';
import { AlertTriangle, Repeat, X } from 'lucide-react';
import type {
  Appointment,
  SeriesCancelScope,
} from '../../../types/appointment';
import {
  formatDate,
  formatTimeRange,
  getRecurrenceLabel,
} from '../../../utils/formatters';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (scope: SeriesCancelScope) => Promise<void>;
}

export function CancelAppointmentModal({
  isOpen,
  appointment,
  loading,
  onClose,
  onConfirm,
}: CancelAppointmentModalProps) {
  const [scope, setScope] = useState<SeriesCancelScope>('this_only');

  if (!isOpen || !appointment) return null;

  const isPartOfSeries = Boolean(appointment.recurrenceId);

  return (
    <div
      className="modal-backdrop"
      id="cancel-appointment-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-content"
        id="cancel-appointment-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={22} color="var(--danger)" />
            <h3 id="cancel-appointment-modal-title">Cancelar Atendimento</h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Fechar"
            id="close-cancel-appointment-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ color: 'var(--text)', fontSize: '14px', lineHeight: 1.5 }}>
            Deseja cancelar o atendimento de{' '}
            <strong>{appointment.patient?.name || 'Paciente'}</strong>?
          </p>

          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--surface-hover)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              <strong>Data:</strong> {formatDate(appointment.startAt)}
            </div>
            <div>
              <strong>Horário:</strong>{' '}
              {formatTimeRange(appointment.startAt, appointment.endAt)}
            </div>
            {isPartOfSeries && (
              <div style={{ marginTop: '4px', color: 'var(--primary)' }}>
                <strong>Série:</strong>{' '}
                {getRecurrenceLabel(appointment.recurrenceId)}
              </div>
            )}
          </div>

          {/* ESCOPO DE CANCELAMENTO PARA RECORRÊNCIA */}
          {isPartOfSeries && (
            <div
              className="recurrence-edit-scope-box"
              style={{ borderLeftColor: 'var(--danger)' }}
            >
              <div className="recurrence-scope-header">
                <Repeat size={16} color="var(--danger)" />
                <strong>Atendimento pertencente a uma série recorrente</strong>
              </div>
              <p className="recurrence-scope-question">
                O que você deseja cancelar?
              </p>

              <div className="recurrence-radio-options">
                <label className="recurrence-radio-label">
                  <input
                    type="radio"
                    name="cancelScope"
                    value="this_only"
                    checked={scope === 'this_only'}
                    onChange={() => setScope('this_only')}
                    disabled={loading}
                  />
                  <div className="radio-text-group">
                    <span className="radio-title">
                      Cancelar somente esta sessão (Padrão)
                    </span>
                    <span className="radio-desc">
                      Cancela apenas a consulta de{' '}
                      {formatDate(appointment.startAt)}. O horário desta data
                      ficará livre para outro paciente e as demais sessões da
                      série permanecerão agendadas.
                    </span>
                  </div>
                </label>

                <label className="recurrence-radio-label">
                  <input
                    type="radio"
                    name="cancelScope"
                    value="this_and_future"
                    checked={scope === 'this_and_future'}
                    onChange={() => setScope('this_and_future')}
                    disabled={loading}
                  />
                  <div className="radio-text-group">
                    <span className="radio-title">
                      Cancelar esta e todas as próximas
                    </span>
                    <span className="radio-desc">
                      Encerra as ocorrências futuras desta série, liberando os
                      horários correspondentes para novos agendamentos.
                      Atendimentos passados são preservados.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            O status da consulta passará para <strong>Cancelado</strong>,
            mantendo o histórico seguro e liberando o horário para a marcação de
            outros pacientes.
          </p>
        </div>

        <div className="modal-footer" style={{ marginTop: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
            id="abort-cancel-appointment-btn"
          >
            Voltar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onConfirm(scope)}
            disabled={loading}
            id="confirm-cancel-appointment-btn"
          >
            {loading
              ? 'Cancelando...'
              : scope === 'this_and_future'
                ? 'Cancelar Série Futura'
                : 'Cancelar Sessão'}
          </button>
        </div>
      </div>
    </div>
  );
}
