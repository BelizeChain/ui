'use client';

import { useState, useCallback, useMemo } from 'react';
import { MagnifyingGlass, FunnelSimple, X, CalendarBlank, SortAscending } from 'phosphor-react';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface SearchFilterProps {
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: {
    label: string;
    key: string;
    options: FilterOption[];
    multi?: boolean;
  }[];
  activeFilters: Record<string, string | string[]>;
  onFilterChange: (key: string, value: string | string[]) => void;
  sortOptions?: { label: string; value: string }[];
  activeSort: string;
  onSortChange: (value: string) => void;
  dateRange?: { start: string; end: string };
  onDateRangeChange?: (range: { start: string; end: string }) => void;
  showFilterPanel?: boolean;
  onToggleFilterPanel?: () => void;
}

export function SearchFilter({
  placeholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [],
  activeFilters,
  onFilterChange,
  sortOptions = [],
  activeSort,
  onSortChange,
  dateRange,
  onDateRangeChange,
  showFilterPanel = false,
  onToggleFilterPanel,
}: SearchFilterProps) {
  const [localShowFilters, setLocalShowFilters] = useState(showFilterPanel);

  const toggleFilters = () => {
    if (onToggleFilterPanel) {
      onToggleFilterPanel();
    } else {
      setLocalShowFilters(!localShowFilters);
    }
  };

  const activeFiltersDisplay = onToggleFilterPanel !== undefined ? showFilterPanel : localShowFilters;

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).filter((v) => 
      Array.isArray(v) ? v.length > 0 : v !== ''
    ).length;
  }, [activeFilters]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    filters.forEach((filter) => {
      onFilterChange(filter.key, filter.multi ? [] : '');
    });
    onSearchChange('');
    if (onDateRangeChange) {
      onDateRangeChange({ start: '', end: '' });
    }
  }, [filters, onFilterChange, onSearchChange, onDateRangeChange]);

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <MagnifyingGlass
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            weight="bold"
          />
          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <X size={16} className="text-gray-400" weight="bold" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={toggleFilters}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all',
            activeFiltersDisplay || activeFilterCount > 0
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'bg-gray-800/50 text-gray-400 border border-gray-700 hover:bg-gray-800'
          )}
        >
          <FunnelSimple size={20} weight="bold" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-xs font-bold rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        {sortOptions.length > 0 && (
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Filter Panel */}
      {activeFiltersDisplay && (
        <GlassCard variant="dark-medium" blur="lg" className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Filter Options</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            {onDateRangeChange && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  <CalendarBlank size={14} className="inline mr-1" weight="duotone" />
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateRange?.start || ''}
                    onChange={(e) =>
                      onDateRangeChange({ ...dateRange, start: e.target.value } as any)
                    }
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                  <input
                    type="date"
                    value={dateRange?.end || ''}
                    onChange={(e) =>
                      onDateRangeChange({ ...dateRange, end: e.target.value } as any)
                    }
                    className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Dynamic Filters */}
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  {filter.label}
                </label>
                {filter.multi ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {filter.options.map((option) => {
                      const isSelected = (activeFilters[filter.key] as string[] || []).includes(
                        option.value
                      );
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const current = (activeFilters[filter.key] as string[]) || [];
                              const updated = e.target.checked
                                ? [...current, option.value]
                                : current.filter((v) => v !== option.value);
                              onFilterChange(filter.key, updated);
                            }}
                            className="w-4 h-4 bg-gray-800 border-gray-700 rounded text-blue-500 focus:ring-2 focus:ring-blue-500/50"
                          />
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                            {option.label}
                            {option.count !== undefined && (
                              <span className="ml-1 text-xs text-gray-500">({option.count})</span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <select
                    value={(activeFilters[filter.key] as string) || ''}
                    onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                        {option.count !== undefined && ` (${option.count})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Active Filter Chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700/50">
              {Object.entries(activeFilters).map(([key, value]) => {
                if (Array.isArray(value) && value.length > 0) {
                  return value.map((v) => {
                    const filter = filters.find((f) => f.key === key);
                    const option = filter?.options.find((o) => o.value === v);
                    return (
                      <button
                        key={`${key}-${v}`}
                        onClick={() => {
                          const current = value as string[];
                          onFilterChange(
                            key,
                            current.filter((val) => val !== v)
                          );
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/30 transition-colors"
                      >
                        {option?.label || v}
                        <X size={12} weight="bold" />
                      </button>
                    );
                  });
                } else if (value && !Array.isArray(value)) {
                  const filter = filters.find((f) => f.key === key);
                  const option = filter?.options.find((o) => o.value === value);
                  return (
                    <button
                      key={key}
                      onClick={() => onFilterChange(key, '')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      {filter?.label}: {option?.label || value}
                      <X size={12} weight="bold" />
                    </button>
                  );
                }
                return null;
              })}
              {searchValue && (
                <button
                  onClick={() => onSearchChange('')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  Search: "{searchValue}"
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
}
