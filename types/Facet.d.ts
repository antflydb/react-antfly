import { ReactNode } from "react";
import { TermFacetResult } from "@antfly/sdk";
export interface FacetProps {
    fields: string[];
    id: string;
    initialValue?: string[];
    seeMore?: string;
    placeholder?: string;
    showFilter?: boolean;
    filterValueModifier?: (value: string) => string;
    itemsPerBlock?: number;
    items?: (data: TermFacetResult[], options: {
        handleChange: (item: TermFacetResult, checked: boolean) => void;
        isChecked: (item: TermFacetResult) => boolean;
    }) => ReactNode;
}
export default function Facet({ fields, id, initialValue, seeMore, placeholder, showFilter, filterValueModifier, itemsPerBlock, items, }: FacetProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Facet.d.ts.map