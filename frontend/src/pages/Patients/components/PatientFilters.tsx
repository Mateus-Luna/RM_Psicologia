import { Search, X } from 'lucide-react';
import type { PatientFilters as PatientFiltersType } from '../../../types/patient';

interface PatientFiltersProps {
  filters: PatientFiltersType;
  onChange: (filters: PatientFiltersType) => void;
  onClear: () => void;
}

export function PatientFilters({
  filters,
  onChange,
  onClear,
}: PatientFiltersProps) {
  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.hasMedicalFollowUp) ||
    Boolean(filters.usesMedication) ||
    Boolean(filters.medication);

  return (
    <section className="filters-card" id="patient-filters-card">
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          id="patient-search-input"
          type="text"
          className="search-input"
          placeholder="Buscar por nome ou CPF..."
          value={filters.search ?? ''}
          onChange={(e) =>
            onChange({
              ...filters,
              search: e.target.value,
            })
          }
        />
      </div>

      <div className="filters-grid">
        <div className="filter-item">
          <label htmlFor="filter-medical-follow-up">
            Acompanhamento médico
          </label>
          <select
            id="filter-medical-follow-up"
            className="filter-select"
            value={filters.hasMedicalFollowUp ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                hasMedicalFollowUp: e.target.value,
              })
            }
          >
            <option value="">Todos</option>
            <option value="true">Com acompanhamento</option>
            <option value="false">Sem acompanhamento</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="filter-uses-medication">Medicamentos</label>
          <select
            id="filter-uses-medication"
            className="filter-select"
            value={filters.usesMedication ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                usesMedication: e.target.value,
              })
            }
          >
            <option value="">Todos</option>
            <option value="true">Usa medicamentos</option>
            <option value="false">Não usa medicamentos</option>
          </select>
        </div>

        <div className="filter-item">
          <label htmlFor="filter-specific-medication">
            Medicamento específico
          </label>
          <input
            id="filter-specific-medication"
            type="text"
            className="filter-input"
            placeholder="Ex: Sertralina"
            value={filters.medication ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                medication: e.target.value,
              })
            }
          />
        </div>

        {hasActiveFilters && (
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              id="clear-filters-button"
              className="btn btn-secondary btn-sm"
              onClick={onClear}
              title="Limpar todos os filtros"
            >
              <X size={15} />
              <span>Limpar filtros</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
