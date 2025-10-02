import { ReactNode } from "react";
import { QueryHit } from "@antfly/sdk";
export interface ResultsProps {
    itemsPerPage?: number;
    initialPage?: number;
    pagination?: (total: number, itemsPerPage: number, page: number, setPage: (page: number) => void) => ReactNode;
    stats?: (total: number) => ReactNode;
    items: (data: QueryHit[]) => ReactNode;
    id: string;
    sort?: unknown;
    fields?: string[];
}
export default function Results({ itemsPerPage, initialPage, pagination, stats, items, id, sort, fields, }: ResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Results.d.ts.map