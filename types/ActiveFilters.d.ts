import { ReactNode } from 'react';
export interface ActiveFilter {
    key: string;
    value: string;
}
export interface ActiveFiltersProps {
    items?: (activeFilters: ActiveFilter[], removeFilter: (id: string) => void) => ReactNode;
}
export default function ActiveFilters({ items }: ActiveFiltersProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=ActiveFilters.d.ts.map