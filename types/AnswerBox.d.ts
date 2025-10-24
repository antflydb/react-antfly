import { ReactNode } from 'react';
export interface AnswerBoxProps {
    customQuery?: (query?: string) => unknown;
    fields?: string[];
    id: string;
    initialValue?: string;
    placeholder?: string;
    semanticIndexes?: string[];
    limit?: number;
    children?: ReactNode;
    buttonLabel?: string;
    onSubmit?: (value: string) => void;
}
export default function AnswerBox({ customQuery, fields, id, initialValue, placeholder, semanticIndexes, limit, children, buttonLabel, onSubmit, }: AnswerBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnswerBox.d.ts.map