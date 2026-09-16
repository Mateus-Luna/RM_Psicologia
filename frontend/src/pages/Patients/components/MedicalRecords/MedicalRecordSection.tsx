import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  Printer,
  RefreshCw,
} from 'lucide-react';
import type { Patient } from '../../../../types/patient';
import type { MedicalRecordEntry } from '../../../../types/medical-record';
import { MedicalRecordEntryType } from '../../../../types/medical-record';
import { medicalRecordsService } from '../../../../services/medical-records.service';
import { MedicalRecordFilters } from './MedicalRecordFilters';
import { MedicalRecordCard } from './MedicalRecordCard';
import { MedicalRecordModal } from './MedicalRecordModal';
import { DeleteMedicalRecordModal } from './DeleteMedicalRecordModal';
import { MedicalRecordPrintDocument } from './MedicalRecordPrintDocument';

interface MedicalRecordSectionProps {
  patient: Patient;
  onRecordCountChange?: (count: number) => void;
}

export function MedicalRecordSection({
  patient,
  onRecordCountChange,
}: MedicalRecordSectionProps) {
  const [entries, setEntries] = useState<MedicalRecordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<MedicalRecordEntryType | ''>(
    '',
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<MedicalRecordEntry | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<MedicalRecordEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Print state
  const [printDocument, setPrintDocument] = useState<{
    mode: 'single' | 'filtered' | 'all';
    entries: MedicalRecordEntry[];
    description?: string;
  } | null>(null);
  const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false);

  // Load entries from backend API
  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params: {
        search?: string;
        type?: MedicalRecordEntryType;
        startDate?: string;
        endDate?: string;
      } = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedType) {
        params.type = selectedType;
      }

      if (startDate) {
        params.startDate = new Date(`${startDate}T00:00:00`).toISOString();
      }

      if (endDate) {
        params.endDate = new Date(`${endDate}T23:59:59.999`).toISOString();
      }

      const data = await medicalRecordsService.getMedicalRecordEntries(
        patient.id,
        params,
      );
      const list = Array.isArray(data) ? data : [];
      setEntries(list);
      if (onRecordCountChange && !search && !selectedType && !startDate && !endDate) {
        onRecordCountChange(list.length);
      }
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Não foi possível carregar os registros do prontuário.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  }, [patient.id, search, selectedType, startDate, endDate, onRecordCountChange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadEntries();
    }, 50);

    return () => clearTimeout(timer);
  }, [loadEntries]);

  // Check if any filter is active
  const hasActiveFilters = Boolean(
    search.trim() || selectedType || startDate || endDate,
  );

  function handleClearFilters() {
    setSearch('');
    setSelectedType('');
    setStartDate('');
    setEndDate('');
  }

  // Handle open modal for create
  function handleOpenCreate() {
    setEntryToEdit(null);
    setModalError('');
    setIsModalOpen(true);
  }

  // Handle open modal for edit
  function handleOpenEdit(entry: MedicalRecordEntry) {
    setEntryToEdit(entry);
    setModalError('');
    setIsModalOpen(true);
  }

  // Handle modal save
  async function handleSaveRecord(payload: {
    type: MedicalRecordEntryType;
    entryDate: string;
    content: string;
  }) {
    setModalLoading(true);
    setModalError('');

    try {
      if (entryToEdit) {
        // Edit existing record
        await medicalRecordsService.updateMedicalRecordEntry(
          patient.id,
          entryToEdit.id,
          payload,
        );
        setSuccessMessage('Registro atualizado com sucesso no prontuário!');
      } else {
        // Create new record
        await medicalRecordsService.createMedicalRecordEntry(
          patient.id,
          payload,
        );
        setSuccessMessage('Novo registro adicionado com sucesso ao prontuário!');
      }

      setIsModalOpen(false);
      setEntryToEdit(null);
      await loadEntries();

      // Clear success notification after 4s
      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Erro ao salvar registro. Verifique os dados e tente novamente.';
      setModalError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setModalLoading(false);
    }
  }

  // Handle open modal for delete
  function handleOpenDelete(entry: MedicalRecordEntry) {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  }

  // Handle confirm delete
  async function handleConfirmDelete() {
    if (!entryToDelete) return;
    setDeleteLoading(true);
    try {
      await medicalRecordsService.deleteMedicalRecordEntry(
        patient.id,
        entryToDelete.id,
      );
      setSuccessMessage('Registro removido do prontuário com sucesso!');
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
      await loadEntries();

      setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Erro ao apagar registro. Tente novamente.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
      setIsDeleteModalOpen(false);
      setEntryToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  // Printing execution
  function executePrint(
    mode: 'single' | 'filtered' | 'all',
    recordEntries: MedicalRecordEntry[],
    description?: string,
  ) {
    setPrintDocument({
      mode,
      entries: recordEntries,
      description,
    });
    setIsPrintOptionsOpen(false);

    // Allow state to render into print DOM, then invoke browser/Electron print
    setTimeout(() => {
      window.print();
    }, 150);
  }

  // Individual record print
  function handlePrintIndividual(entry: MedicalRecordEntry) {
    executePrint('single', [entry]);
  }

  // Filtered print
  function handlePrintFiltered() {
    const parts: string[] = [];
    if (selectedType) {
      parts.push(
        selectedType === MedicalRecordEntryType.APPOINTMENT
          ? 'Tipo: Atendimentos'
          : 'Tipo: Anotações Gerais',
      );
    }
    if (startDate) {
      parts.push(`A partir de ${startDate}`);
    }
    if (endDate) {
      parts.push(`Até ${endDate}`);
    }
    if (search.trim()) {
      parts.push(`Busca: "${search.trim()}"`);
    }
    const desc = parts.join(' | ');
    executePrint('filtered', entries, desc);
  }

  // Complete history print (fetches unfiltered if filters are active)
  async function handlePrintAll() {
    if (!hasActiveFilters) {
      executePrint('all', entries);
      return;
    }

    try {
      const allEntries =
        await medicalRecordsService.getMedicalRecordEntries(patient.id);
      executePrint('all', allEntries);
    } catch {
      executePrint('all', entries);
    }
  }

  const filterSummary = useMemo(() => {
    if (!hasActiveFilters) return '';
    const parts: string[] = [];
    if (selectedType) {
      parts.push(
        selectedType === MedicalRecordEntryType.APPOINTMENT
          ? 'Atendimentos'
          : 'Anotações',
      );
    }
    if (startDate && endDate) {
      parts.push(`${startDate} até ${endDate}`);
    } else if (startDate) {
      parts.push(`desde ${startDate}`);
    } else if (endDate) {
      parts.push(`até ${endDate}`);
    }
    if (search.trim()) {
      parts.push(`"${search.trim()}"`);
    }
    return parts.join(' • ');
  }, [hasActiveFilters, selectedType, startDate, endDate, search]);

  return (
    <div className="medical-records-section" id="patient-medical-records-section">
      {/* CONTEXT HEADER & TOP ACTIONS */}
      <div className="medical-records-header-row">
        <div className="medical-records-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)' }}>
              Prontuário e Histórico Clínico
            </h3>
          </div>
          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginTop: '3px',
            }}
          >
            Registros cronológicos de sessões, atendimentos e notas clínicas de{' '}
            <strong>{patient.name}</strong>.
          </p>
        </div>

        <div className="medical-records-actions">
          {/* PRINT MENU */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              id="print-medical-records-menu-btn"
              onClick={() => setIsPrintOptionsOpen((prev) => !prev)}
              title="Opções de impressão do prontuário"
              disabled={entries.length === 0}
            >
              <Printer size={15} />
              <span>Imprimir prontuário</span>
            </button>

            {isPrintOptionsOpen && (
              <div
                className="print-dropdown-menu"
                id="print-dropdown-menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  zIndex: 20,
                }}
              >
                <button
                  type="button"
                  className="print-dropdown-item"
                  onClick={handlePrintAll}
                  id="print-all-records-option"
                >
                  <span>Imprimir histórico completo</span>
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="print-dropdown-item"
                    onClick={handlePrintFiltered}
                    id="print-filtered-records-option"
                  >
                    <span>Imprimir resultados filtrados ({entries.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* NEW RECORD BUTTON */}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenCreate}
            id="new-medical-record-btn"
          >
            <Plus size={16} />
            <span>Novo registro</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERTS */}
      {successMessage && (
        <div className="alert alert-success" id="medical-record-success-alert">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" id="medical-record-error-alert">
          <AlertCircle size={18} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadEntries}
              style={{ marginLeft: 'auto' }}
            >
              <RefreshCw size={14} />
              <span>Tentar novamente</span>
            </button>
          </div>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <MedicalRecordFilters
        search={search}
        onSearchChange={setSearch}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        totalResults={entries.length}
      />

      {/* ACTIVE FILTERS CHIP */}
      {hasActiveFilters && (
        <div className="active-filters-bar">
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Filtros ativos: <strong>{filterSummary}</strong>
          </span>
          <button
            type="button"
            className="btn-link"
            onClick={handleClearFilters}
            style={{ fontSize: '13px', color: 'var(--primary)', cursor: 'pointer' }}
          >
            Limpar
          </button>
        </div>
      )}

      {/* TIMELINE / RECORDS LIST */}
      <div className="medical-records-timeline" id="medical-records-timeline">
        {loading ? (
          <div className="table-card">
            <div className="table-loading">
              <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 12px' }} />
              <p>Carregando registros do prontuário...</p>
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="table-card" id="empty-medical-records-card">
            <div className="table-empty">
              <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              {hasActiveFilters ? (
                <>
                  <p
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      marginBottom: '6px',
                    }}
                  >
                    Nenhum registro encontrado para estes filtros.
                  </p>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '16px',
                    }}
                  >
                    Tente buscar por outros termos ou redefina o período e tipo de registro.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleClearFilters}
                  >
                    Limpar filtros
                  </button>
                </>
              ) : (
                <>
                  <p
                    style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--text)',
                      marginBottom: '6px',
                    }}
                  >
                    Este paciente ainda não possui registros no prontuário.
                  </p>
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      marginBottom: '18px',
                    }}
                  >
                    Inicie o histórico clínico registrando o primeiro atendimento ou anotação geral.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleOpenCreate}
                    id="empty-new-record-btn"
                  >
                    <Plus size={16} />
                    <span>Novo registro</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="records-list-wrapper">
            {entries.map((entry) => (
              <MedicalRecordCard
                key={entry.id}
                entry={entry}
                onEdit={handleOpenEdit}
                onPrint={handlePrintIndividual}
                onDelete={handleOpenDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <MedicalRecordModal
        key={isModalOpen ? (entryToEdit?.id ?? 'new') : 'closed'}
        isOpen={isModalOpen}
        entryToEdit={entryToEdit}
        patientName={patient.name}
        loading={modalLoading}
        error={modalError}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteMedicalRecordModal
        isOpen={isDeleteModalOpen}
        entry={entryToDelete}
        loading={deleteLoading}
        onClose={() => {
          if (!deleteLoading) {
            setIsDeleteModalOpen(false);
            setEntryToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* HIDDEN PRINT VIEW (RENDERED ON DEMAND FOR PRINT DIALOG) */}
      {printDocument && (
        <MedicalRecordPrintDocument
          patient={patient}
          entries={printDocument.entries}
          printMode={printDocument.mode}
          filterDescription={printDocument.description}
        />
      )}
    </div>
  );
}
