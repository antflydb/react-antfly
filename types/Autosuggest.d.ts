import { default as React, ReactNode } from 'react';
export interface AutosuggestProps {
    fields: string[];
    limit?: number;
    minChars?: number;
    renderSuggestion?: (suggestion: string, count?: number) => ReactNode;
    customQuery?: (value: string, fields: string[]) => unknown;
    searchValue?: string;
    onSuggestionSelect?: (value: string) => void;
    containerRef?: React.RefObject<HTMLDivElement>;
}
export default function Autosuggest({ fields, limit, minChars, renderSuggestion, customQuery, searchValue, onSuggestionSelect, containerRef, }: AutosuggestProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=Autosuggest.d.ts.map