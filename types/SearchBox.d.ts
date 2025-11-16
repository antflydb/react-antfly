import { ReactNode } from 'react';
/**
 * @deprecated Use QueryBox with mode="live" instead.
 * SearchBox is maintained for backward compatibility.
 */
export interface SearchBoxProps {
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
}
/**
 * @deprecated Use QueryBox with mode="live" instead.
 *
 * SearchBox is a legacy component maintained for backward compatibility.
 * For new code, use QueryBox with Results:
 *
 * @example
 * ```tsx
 * <QueryBox id="search" mode="live" />
 * <Results
 *   searchBoxId="search"
 *   fields={["title", "content"]}
 *   items={(data) => ...}
 * />
 * ```
 */
export default function SearchBox({ id, initialValue, placeholder, children, customQuery: _customQuery, fields: _fields, semanticIndexes: _semanticIndexes, limit: _limit, table: _table, filterQuery: _filterQuery, exclusionQuery: _exclusionQuery, }: SearchBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SearchBox.d.ts.map