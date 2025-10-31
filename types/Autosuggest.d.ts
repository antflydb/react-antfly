import { default as React, ReactNode } from 'react';
import { QueryHit } from '@antfly/sdk';
export interface AutosuggestProps {
    fields?: string[];
    returnFields?: string[];
    limit?: number;
    minChars?: number;
    renderSuggestion?: (hit: QueryHit) => ReactNode;
    customQuery?: (value?: string, fields?: string[]) => unknown;
    semanticIndexes?: string[];
    table?: string;
    filterQuery?: Record<string, unknown>;
    searchValue?: string;
    onSuggestionSelect?: (hit: QueryHit) => void;
    containerRef?: React.RefObject<HTMLDivElement | null>;
    isOpen?: boolean;
}
export default function Autosuggest({ fields, returnFields, limit, minChars, renderSuggestion, customQuery, semanticIndexes, table, filterQuery, searchValue, onSuggestionSelect, containerRef, isOpen: isOpenProp, }: AutosuggestProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=Autosuggest.d.ts.map