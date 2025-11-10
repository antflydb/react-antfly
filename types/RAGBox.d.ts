import { ReactNode } from 'react';
export interface RAGBoxProps {
    customQuery?: (query?: string) => unknown;
    fields?: string[];
    id: string;
    initialValue?: string;
    placeholder?: string;
    semanticIndexes?: string[];
    limit?: number;
    table?: string;
    filterQuery?: Record<string, unknown>;
    exclusionQuery?: Record<string, unknown>;
    children?: ReactNode;
    buttonLabel?: string;
    onSubmit?: (value: string) => void;
    onInputChange?: (value: string) => void;
    onEscape?: (clearInput: () => void) => boolean;
}
export default function RAGBox({ customQuery, fields, id, initialValue, placeholder, semanticIndexes, limit, table, filterQuery, exclusionQuery, children, buttonLabel, onSubmit, onInputChange, onEscape, }: RAGBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RAGBox.d.ts.map