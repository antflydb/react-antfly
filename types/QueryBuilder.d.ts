import * as React from 'react';

export interface QueryBuilderField {
  value: string;
  label: string;
}

export interface QueryBuilderOperator {
  value: string;
  label: string;
}

export interface QueryBuilderCombinator {
  value: string;
  label: string;
}

export interface QueryBuilderRule {
  field: string;
  operator: string;
  value?: any;
  key?: string;
}

export interface QueryBuilderProps {
  fields: (QueryBuilderField | string)[];
  operators?: QueryBuilderOperator[];
  combinators?: QueryBuilderCombinator[];
  templateRule?: Partial<QueryBuilderRule>;
  initialValue?: any;
  id: string;
  autoComplete?: boolean;
}

declare const QueryBuilder: React.FC<QueryBuilderProps>;
export default QueryBuilder;