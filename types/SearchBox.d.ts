import { ReactNode } from 'react';
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
export default function SearchBox({ customQuery, fields, id, initialValue, placeholder, semanticIndexes, limit, table, filterQuery, exclusionQuery, children, }: SearchBoxProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SearchBox.d.ts.map