import { ReactNode } from "react";
export interface ResultsProps {
    itemsPerPage?: number;
    initialPage?: number;
    pagination?: (total: number, itemsPerPage: number, page: number, setPage: (page: number) => void) => ReactNode;
    stats?: (total: number) => ReactNode;
    items: (data: unknown[]) => ReactNode;
    id: string;
    sort?: unknown;
}
export default function Results({ itemsPerPage, initialPage, pagination, stats, items, id, sort, }: ResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Results.d.ts.map