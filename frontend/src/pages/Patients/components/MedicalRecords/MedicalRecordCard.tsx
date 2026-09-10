import { Calendar, FileText, Pencil, Printer, Stethoscope, Trash2 } from 'lucide-react';
import type { MedicalRecordEntry } from '../../../../types/medical-record';
import { MedicalRecordEntryType } from '../../../../types/medical-record';
import { formatDateTime } from '../../../../utils/formatters';

interface MedicalRecordCardProps {
  entry: MedicalRecordEntry;
  onEdit: (entry: MedicalRecordEntry) => void;
  onPrint: (entry: MedicalRecordEntry) => void;
  onDelete: (entry: MedicalRecordEntry) => void;
}

export function MedicalRecordCard({
  entry,
  onEdit,
  onPrint,
  onDelete,
}: MedicalRecordCardProps) {
  const isAppointment = entry.type === MedicalRecordEntryType.APPOINTMENT;

  return (
    <article
      className={`medical-record-card ${
        isAppointment ? 'card-appointment' : 'card-general-note'
      }`}
      id={`medical-record-entry-${entry.id}`}
    >
      {/* CARD HEADER */}
      <div className="record-card-header">
        <div className="record-card-meta">
          <div className="record-date-badge">
            <Calendar size={15} />
            <span>{formatDateTime(entry.entryDate)}</span>
          </div>

          <span
            className={`badge ${
              isAppointment ? 'badge-primary' : 'badge-general-note'
            }`}
          >
            {isAppointment ? (
              <>
                <Stethoscope size={13} />
                <span>Atendimento</span>
              </>
            ) : (
              <>
                <FileText size={13} />
                <span>Anotação Geral</span>
              </>
            )}
          </span>
        </div>

        {/* ACTIONS */}
        <div className="record-card-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onEdit(entry)}
            id={`edit-record-${entry.id}-btn`}
            title="Editar registro"
          >
            <Pencil size={14} />
            <span>Editar</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onPrint(entry)}
            id={`print-record-${entry.id}-btn`}
            title="Imprimir este registro"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            className="btn btn-danger-outline btn-sm"
            onClick={() => onDelete(entry)}
            id={`delete-record-${entry.id}-btn`}
            title="Apagar este registro"
          >
            <Trash2 size={14} />
            <span>Apagar</span>
          </button>
        </div>
      </div>

      {/* CLINICAL CONTENT */}
      <div className="record-card-body">
        <p className="record-content-text">{entry.content}</p>
      </div>

      {/* METADATA FOOTER */}
      <div className="record-card-footer">
        <span>Registrado em {formatDateTime(entry.createdAt)}</span>
        {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
          <span>• Última edição em {formatDateTime(entry.updatedAt)}</span>
        )}
      </div>
    </article>
  );
}
