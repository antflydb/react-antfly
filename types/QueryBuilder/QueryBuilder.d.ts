import { Operator, Combinator } from "./utils";
export interface QueryBuilderRule {
    field: string;
    operator: string;
    value: string;
    combinator: 'AND' | 'OR';
    index: number;
    key?: string;
}
export interface FieldOption {
    value: string;
    text?: string;
}
export interface QueryBuilderProps {
    fields: (string | FieldOption)[];
    operators?: Operator[];
    combinators?: Combinator[];
    templateRule?: Partial<QueryBuilderRule>;
    initialValue?: QueryBuilderRule[];
    id: string;
    autoComplete?: boolean;
}
export default function QueryBuilder({ fields, operators, combinators, templateRule, initialValue, id, autoComplete, }: QueryBuilderProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=QueryBuilder.d.ts.map