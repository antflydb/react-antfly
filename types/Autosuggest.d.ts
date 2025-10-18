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
    searchValue?: string;
    onSuggestionSelect?: (hit: QueryHit) => void;
    containerRef?: React.RefObject<HTMLDivElement>;
}
export default function Autosuggest({ fields, returnFields, limit, minChars, renderSuggestion, customQuery, semanticIndexes, searchValue, onSuggestionSelect, containerRef, }: AutosuggestProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=Autosuggest.d.ts.map