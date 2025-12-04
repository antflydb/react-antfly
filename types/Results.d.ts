import { QueryHit } from '@antfly/sdk';
import { ReactNode } from 'react';
export interface ResultsProps {
    id: string;
    searchBoxId?: string;
    fields?: string[];
    customQuery?: (query?: string) => unknown;
    semanticIndexes?: string[];
    limit?: number;
    itemsPerPage?: number;
    initialPage?: number;
    pagination?: (total: number, itemsPerPage: number, page: number, setPage: (page: number) => void) => ReactNode;
    stats?: (total: number) => ReactNode;
    items: (data: QueryHit[]) => ReactNode;
    sort?: unknown;
    table?: string;
    filterQuery?: Record<string, unknown>;
    exclusionQuery?: Record<string, unknown>;
}
export default function Results({ id, searchBoxId, fields, customQuery, semanticIndexes, limit, itemsPerPage, initialPage, pagination, stats, items, sort, table, filterQuery, exclusionQuery, }: ResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Results.d.ts.map