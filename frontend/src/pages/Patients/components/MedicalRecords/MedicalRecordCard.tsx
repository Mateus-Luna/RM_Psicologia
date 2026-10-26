import { useState } from 'react';
import {
  Calendar,
  Download,
  Eye,
  FileText,
  Paperclip,
  Pencil,
  Printer,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react';
import type {
  MedicalRecordAttachment,
  MedicalRecordEntry,
} from '../../../../types/medical-record';
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
  const [lightboxImage, setLightboxImage] =
    useState<MedicalRecordAttachment | null>(null);

  const isAppointment = entry.type === MedicalRecordEntryType.APPOINTMENT;
  const attachments = entry.attachments || [];
  const imageAttachments = attachments.filter((att) =>
    att.type?.startsWith('image/'),
  );
  const docAttachments = attachments.filter(
    (att) => !att.type?.startsWith('image/'),
  );

  function formatFileSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleDownloadAttachment(att: MedicalRecordAttachment) {
    const link = document.createElement('a');
    link.href = att.dataUrl;
    link.download = att.name || 'anexo-prontuario';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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

          {attachments.length > 0 && (
            <span
              className="badge"
              style={{
                background: '#f1f5f9',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
              title={`${attachments.length} arquivo(s) anexado(s)`}
            >
              <Paperclip size={12} />
              <span>
                {attachments.length}{' '}
                {attachments.length === 1 ? 'anexo' : 'anexos'}
              </span>
            </span>
          )}
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

        {/* ATTACHMENTS SECTION */}
        {attachments.length > 0 && (
          <div className="record-card-attachments" id={`attachments-entry-${entry.id}`}>
            {/* IMAGE THUMBNAILS GALLERY */}
            {imageAttachments.length > 0 && (
              <div className="attachments-images-grid">
                {imageAttachments.map((img) => (
                  <div
                    key={img.id}
                    className="attachment-image-thumb-box"
                    onClick={() => setLightboxImage(img)}
                    title={`Clique para ampliar "${img.name}"`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setLightboxImage(img);
                    }}
                  >
                    <img
                      src={img.dataUrl}
                      alt={img.name}
                      className="attachment-image-thumb"
                    />
                    <div className="attachment-image-overlay">
                      <Eye size={18} color="#ffffff" />
                      <span className="attachment-overlay-text">Ampliar</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* DOCUMENT FILES PILLS */}
            {docAttachments.length > 0 && (
              <div className="attachments-docs-list">
                {docAttachments.map((doc) => (
                  <div key={doc.id} className="attachment-doc-pill">
                    <div className="attachment-doc-icon-small">
                      <FileText size={16} color="var(--primary)" />
                    </div>
                    <div className="attachment-doc-info">
                      <span className="attachment-doc-name" title={doc.name}>
                        {doc.name}
                      </span>
                      {doc.size > 0 && (
                        <span className="attachment-doc-size">
                          {formatFileSize(doc.size)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="attachment-download-btn"
                      onClick={() => handleDownloadAttachment(doc)}
                      title="Baixar arquivo"
                    >
                      <Download size={14} />
                      <span>Baixar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* METADATA FOOTER */}
      <div className="record-card-footer">
        <span>Registrado em {formatDateTime(entry.createdAt)}</span>
        {entry.updatedAt && entry.updatedAt !== entry.createdAt && (
          <span>• Última edição em {formatDateTime(entry.updatedAt)}</span>
        )}
      </div>

      {/* LIGHTBOX MODAL FOR FULL-SIZE IMAGE PREVIEW */}
      {lightboxImage && (
        <div
          className="lightbox-backdrop"
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="lightbox-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-header">
              <div className="lightbox-title-box">
                <span className="lightbox-filename">{lightboxImage.name}</span>
                {lightboxImage.size > 0 && (
                  <span className="lightbox-size">
                    ({formatFileSize(lightboxImage.size)})
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownloadAttachment(lightboxImage)}
                  title="Baixar imagem original"
                >
                  <Download size={15} />
                  <span>Baixar</span>
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  style={{ color: '#ffffff' }}
                  onClick={() => setLightboxImage(null)}
                  title="Fechar visualização"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <div className="lightbox-image-wrapper">
              <img
                src={lightboxImage.dataUrl}
                alt={lightboxImage.name}
                className="lightbox-image"
              />
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
