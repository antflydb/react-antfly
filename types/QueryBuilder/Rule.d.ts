import { Operator, Combinator } from "./utils";
import { FieldOption, QueryBuilderRule } from "./QueryBuilder";
export interface RuleProps {
    fields: (string | FieldOption)[];
    operators: Operator[];
    combinators: Combinator[];
    combinator: "AND" | "OR";
    field: string;
    operator: string;
    value: string;
    index: number;
    autoComplete?: boolean;
    onAdd: () => void;
    onDelete: (index: number) => void;
    onChange: (rule: QueryBuilderRule) => void;
}
export default function Rule({ fields, operators, combinators, combinator: initialCombinator, field: initialField, operator: initialOperator, value: initialValue, index, autoComplete, onAdd, onDelete, onChange, }: RuleProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=Rule.d.ts.map