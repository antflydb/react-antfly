import { ReactNode } from "react";
export interface AutosuggestProps {
    fields: string[];
    limit?: number;
    minChars?: number;
    renderSuggestion?: (suggestion: string, count?: number) => ReactNode;
    customQuery?: (value: string, fields: string[]) => unknown;
    searchValue?: string;
    onSuggestionSelect?: (value: string) => void;
}
export default function Autosuggest({ fields, limit, minChars, renderSuggestion, customQuery, searchValue, onSuggestionSelect, }: AutosuggestProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=Autosuggest.d.ts.map