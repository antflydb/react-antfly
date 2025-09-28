import * as React from 'react';

export interface FacetItem {
  key: string;
  doc_count: number;
  [key: string]: any;
}

export interface FacetHandlers {
  handleChange: (item: FacetItem, checked: boolean) => void;
  isChecked: (item: FacetItem) => boolean;
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
  items?: (data: FacetItem[], handlers: FacetHandlers) => React.ReactNode;
}

declare const Facet: React.FC<FacetProps>;
export default Facet;