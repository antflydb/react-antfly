import * as React from 'react';

export interface ResultData {
  [key: string]: any;
}

export interface ResultTotal {
  value?: number;
  [key: string]: any;
}

export interface ResultsData {
  data: ResultData[];
  total: number | ResultTotal;
}

export interface SortOption {
  field: string;
  order: 'asc' | 'desc';
}

export interface ResultsProps {
  itemsPerPage?: number;
  initialPage?: number;
  pagination?: (
    total: number,
    itemsPerPage: number,
    page: number,
    setPage: (page: number) => void
  ) => React.ReactNode;
  stats?: (total: number) => React.ReactNode;
  items: (data: ResultData[]) => React.ReactNode;
  id: string;
  sort?: SortOption | SortOption[];
}

declare const Results: React.FC<ResultsProps>;
export default Results;