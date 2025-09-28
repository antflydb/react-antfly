import * as React from 'react';

export interface SearchBoxField {
  field: string;
  match: string;
}

export interface SearchBoxQuery {
  match?: string;
  field?: string;
  disjuncts?: SearchBoxField[];
  match_all?: {};
}

export interface SearchBoxProps {
  customQuery?: (query: string | null) => SearchBoxQuery;
  fields?: string[];
  id: string;
  initialValue?: string;
  placeholder?: string;
  semanticIndexes?: string[];
  limit?: number;
}

declare const SearchBox: React.FC<SearchBoxProps>;
export default SearchBox;