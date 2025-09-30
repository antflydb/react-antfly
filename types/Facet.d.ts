import { ReactNode } from "react";
export interface FacetItem {
    key: string;
    doc_count: number;
}
export interface FacetProps {
    fields: string[];
    id: string;
    initialValue?: string[];
    seeMore?: string;
    placeholder?: string;
    showFilter?: boolean;
    filterValueModifier?: (value: string) => string;
    itemsPerBlock?: number;
    items?: (data: FacetItem[], options: {
        handleChange: (item: FacetItem, checked: boolean) => void;
        isChecked: (item: FacetItem) => boolean;
    }) => ReactNode;
}
export default function Facet({ fields, id, initialValue, seeMore, placeholder, showFilter, filterValueModifier, itemsPerBlock, items, }: FacetProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Facet.d.ts.map