import { ReactNode } from 'react';
/**
 * @deprecated Use QueryBox with mode="submit" instead.
 * AnswerBox is maintained for backward compatibility.
 */
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
/**
 * @deprecated Use QueryBox with mode="submit" instead.
 *
 * AnswerBox is a legacy component maintained for backward compatibility.
 * For new code, use QueryBox with AnswerResults:
 *
 * @example
 * ```tsx
 * <QueryBox id="answer" mode="submit" buttonLabel="Ask" />
 * <AnswerResults
 *   searchBoxId="answer"
 *   generator={{...}}
 * />
 * ```
 */
export default function AnswerBox({ id, initialValue, placeholder, children, buttonLabel, onSubmit, onInputChange, onEscape, customQuery: _customQuery, fields: _fields, semanticIndexes: _semanticIndexes, limit: _limit, table: _table, filterQuery: _filterQuery, exclusionQuery: _exclusionQuery, }: AnswerBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnswerBox.d.ts.map