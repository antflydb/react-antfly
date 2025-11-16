import { ReactNode } from 'react';
/**
 * @deprecated Use QueryBox with mode="submit" instead.
 * RAGBox is maintained for backward compatibility.
 */
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
/**
 * @deprecated Use QueryBox with mode="submit" instead.
 *
 * RAGBox is a legacy component maintained for backward compatibility.
 * For new code, use QueryBox with RAGResults:
 *
 * @example
 * ```tsx
 * <QueryBox id="rag" mode="submit" buttonLabel="Ask" />
 * <RAGResults
 *   searchBoxId="rag"
 *   summarizer={{...}}
 *   fields={["content"]}
 * />
 * ```
 */
export default function RAGBox({ id, initialValue, placeholder, children, buttonLabel, onSubmit, onInputChange, onEscape, customQuery: _customQuery, fields: _fields, semanticIndexes: _semanticIndexes, limit: _limit, table: _table, filterQuery: _filterQuery, exclusionQuery: _exclusionQuery, }: RAGBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RAGBox.d.ts.map