import { QueryHit, TermFacetResult } from '@antfly/sdk';
import { default as React, ReactNode } from 'react';
export interface AutosuggestContextValue {
    query: string;
    results: QueryHit[];
    facetData: Map<string, TermFacetResult[]>;
    selectedIndex: number;
    handleSelect: (value: string) => void;
    isLoading: boolean;
    registerItem: (id: string) => number;
    unregisterItem: (id: string) => void;
    fields?: string[];
}
export declare function useAutosuggestContext(): AutosuggestContextValue;
export interface AutosuggestProps {
    fields?: string[];
    returnFields?: string[];
    limit?: number;
    minChars?: number;
    debounceMs?: number;
    renderSuggestion?: (hit: QueryHit) => ReactNode;
    customQuery?: (value?: string, fields?: string[]) => unknown;
    semanticIndexes?: string[];
    table?: string;
    filterQuery?: Record<string, unknown>;
    exclusionQuery?: Record<string, unknown>;
    searchValue?: string;
    onSuggestionSelect?: (hit: QueryHit) => void;
    containerRef?: React.RefObject<HTMLDivElement | null>;
    isOpen?: boolean;
    children?: ReactNode;
    layout?: 'vertical' | 'horizontal' | 'grid' | 'custom';
    className?: string;
    dropdownClassName?: string;
}
export interface AutosuggestResultsProps {
    limit?: number;
    renderItem?: (hit: QueryHit, index: number) => ReactNode;
    onSelect?: (hit: QueryHit) => void;
    filter?: (hit: QueryHit) => boolean;
    className?: string;
    itemClassName?: string;
    selectedItemClassName?: string;
    header?: ReactNode | ((count: number) => ReactNode);
    footer?: ReactNode;
    emptyMessage?: ReactNode;
}
export interface AutosuggestFacetsProps {
    field: string;
    size?: number;
    label?: string;
    order?: 'count' | 'term' | 'reverse_count' | 'reverse_term';
    renderItem?: (facet: TermFacetResult, index: number) => ReactNode;
    renderSection?: (field: string, label: string, terms: TermFacetResult[]) => ReactNode;
    onSelect?: (facet: TermFacetResult) => void;
    clickable?: boolean;
    filter?: (facet: TermFacetResult) => boolean;
    className?: string;
    itemClassName?: string;
    sectionClassName?: string;
    header?: ReactNode | ((field: string, label: string) => ReactNode);
    footer?: ReactNode;
    emptyMessage?: ReactNode;
}
export default function Autosuggest({ fields, returnFields, limit, minChars, debounceMs, renderSuggestion, customQuery, semanticIndexes, table, filterQuery, exclusionQuery, searchValue, onSuggestionSelect, containerRef, isOpen: isOpenProp, children, layout, className, dropdownClassName, }: AutosuggestProps): import("react/jsx-runtime").JSX.Element | null;
export declare function AutosuggestResults({ limit, renderItem, onSelect: onSelectProp, filter, className, itemClassName, selectedItemClassName, header, footer, emptyMessage, }: AutosuggestResultsProps): import("react/jsx-runtime").JSX.Element | null;
export declare function AutosuggestFacets({ field, size, label, order, renderItem, renderSection, onSelect: onSelectProp, clickable, filter, className, itemClassName, sectionClassName, header, footer, emptyMessage, }: AutosuggestFacetsProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=Autosuggest.d.ts.map