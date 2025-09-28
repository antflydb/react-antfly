import * as React from 'react';

export interface PaginationProps {
  onChange: (page: number) => void;
  total: number;
  itemsPerPage: number;
  page: number;
}

declare const Pagination: React.FC<PaginationProps>;
export default Pagination;