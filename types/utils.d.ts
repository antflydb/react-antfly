export interface SearchQuery {
  match?: string;
  field?: string;
  match_all?: {};
  match_none?: {};
  conjuncts?: SearchQuery[];
  disjuncts?: SearchQuery[];
  [key: string]: any;
}

export interface SearchResult {
  data: any[];
  total: number | { value: number; [key: string]: any };
  status?: number;
  error?: { reason: string; [key: string]: any };
}

export interface MsearchQuery {
  query: SearchQuery;
  [key: string]: any;
}

export interface MsearchResponse {
  error?: boolean;
  message?: string;
  responses: SearchResult[];
}

export interface FilterValue {
  [key: string]: any;
}

export interface FacetData {
  key: string;
  doc_count: number;
  [key: string]: any;
}

export interface AntflyConfig {
  url: string;
  headers?: Record<string, string>;
  [key: string]: any;
}

export declare function msearch(
  url: string,
  msearchData: MsearchQuery[],
  headers?: Record<string, string>
): Promise<MsearchResponse>;

export declare function queryFrom(queries: Map<string, SearchQuery>): SearchQuery;

export declare function toTermQueries(
  fields: string[],
  selectedValues: string[]
): SearchQuery[];

export declare function fromUrlQueryString(str?: string): Map<string, any>;

export declare function toUrlQueryString(params: Map<string, any>): string;

export declare function defer(f: () => void): void;

export type FromUrlQueryStringFunction = typeof fromUrlQueryString;
export type ToUrlQueryStringFunction = typeof toUrlQueryString;
export type MsearchFunction = typeof msearch;