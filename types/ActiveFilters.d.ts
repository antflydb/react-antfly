import * as React from 'react';

export interface ActiveFilter {
  key: string;
  value: string;
}

export interface ActiveFiltersProps {
  items?: (
    activeFilters: ActiveFilter[],
    removeFilter: (id: string) => void
  ) => React.ReactNode;
}

declare const ActiveFilters: React.FC<ActiveFiltersProps>;
export default ActiveFilters;