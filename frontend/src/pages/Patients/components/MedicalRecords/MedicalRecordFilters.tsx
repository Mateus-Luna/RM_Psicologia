import { FileText, Layers, Search, Stethoscope, X } from 'lucide-react';
import { MedicalRecordEntryType } from '../../../../types/medical-record';

interface MedicalRecordFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedType: MedicalRecordEntryType | '';
  onTypeChange: (type: MedicalRecordEntryType | '') => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  totalResults: number;
}

export function MedicalRecordFilters({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClearFilters,
  hasActiveFilters,
  totalResults,
}: MedicalRecordFiltersProps) {
  return (
    <div className="filters-card" id="medical-record-filters-card">
      {/* SEARCH BAR */}
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          id="medical-records-search-input"
          placeholder="Buscar no prontuário por termos, palavras-chave ou evolução clínica..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="btn-icon"
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            title="Limpar busca"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* FILTER CONTROLS GRID */}
      <div className="filters-grid medical-records-filters-grid">
        {/* TIPO */}
        <div className="filter-item">
          <label htmlFor="medical-record-type-filter">
            Tipo de Registro
          </label>
          <div
            className="record-type-button-stack segmented-control"
            id="medical-record-type-filter"
            role="group"
            aria-label="Filtrar por tipo de registro"
          >
            <button
              type="button"
              className={`record-type-filter-btn segmented-btn ${selectedType === '' ? 'active' : ''}`}
              onClick={() => onTypeChange('')}
              id="filter-type-all"
            >
              <Layers size={15} />
              <span>Todos</span>
            </button>
            <button
              type="button"
              className={`record-type-filter-btn segmented-btn ${
                selectedType === MedicalRecordEntryType.APPOINTMENT
                  ? 'active active-appointment'
                  : ''
              }`}
              onClick={() => onTypeChange(MedicalRecordEntryType.APPOINTMENT)}
              id="filter-type-appointment"
            >
              <Stethoscope size={15} />
              <span>Atendimentos</span>
            </button>
            <button
              type="button"
              className={`record-type-filter-btn segmented-btn ${
                selectedType === MedicalRecordEntryType.GENERAL_NOTE
                  ? 'active active-general-note'
                  : ''
              }`}
              onClick={() => onTypeChange(MedicalRecordEntryType.GENERAL_NOTE)}
              id="filter-type-general-note"
            >
              <FileText size={15} />
              <span>Anotações</span>
            </button>
          </div>
        </div>

        {/* DATA INICIAL */}
        <div className="filter-item">
          <label htmlFor="medical-record-start-date">Data Inicial</label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              id="medical-record-start-date"
              className="filter-input"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
            />
          </div>
        </div>

        {/* DATA FINAL */}
        <div className="filter-item">
          <label htmlFor="medical-record-end-date">Data Final</label>
          <div style={{ position: 'relative' }}>
            <input
              type="date"
              id="medical-record-end-date"
              className="filter-input"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
            />
          </div>
        </div>

        {/* CLEAR FILTERS & COUNT */}
        <div
          className="filter-item"
          style={{
            justifyContent: 'flex-end',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onClearFilters}
              id="clear-medical-records-filters-btn"
              title="Limpar todos os filtros"
            >
              <X size={14} />
              <span>Limpar filtros</span>
            </button>
          )}

          <span
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}
          >
            {totalResults} {totalResults === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </div>
    </div>
  );
}
