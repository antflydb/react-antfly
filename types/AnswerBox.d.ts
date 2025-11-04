import { ReactNode } from 'react';
export interface AnswerBoxProps {
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
export default function AnswerBox({ customQuery, fields, id, initialValue, placeholder, semanticIndexes, limit, table, filterQuery, exclusionQuery, children, buttonLabel, onSubmit, onInputChange, onEscape, }: AnswerBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnswerBox.d.ts.map