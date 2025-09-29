import React, { useState, useEffect } from "react";
import { useSharedContext } from "../SharedContextProvider";
import {
  defaultOperators,
  defaultCombinators,
  mergedQueries,
  uuidv4,
  withUniqueKey,
  Operator,
  Combinator,
} from "./utils";
import Rule from "./Rule";

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

export default function QueryBuilder({
  fields,
  operators,
  combinators,
  templateRule,
  initialValue,
  id,
  autoComplete,
}: QueryBuilderProps) {
  const [, dispatch] = useSharedContext();
  const finalOperators = operators || defaultOperators;
  const finalCombinators = combinators || defaultCombinators;
  const processedFields = fields.map((f) => {
    if (typeof f === 'string') {
      let field = f;
      if (field?.endsWith?.(".keyword")) field = field.replace(/\.keyword$/, "");
      return field;
    }
    return f;
  });

  const finalTemplateRule: QueryBuilderRule = {
    field: typeof processedFields[0] === 'string' ? processedFields[0] : processedFields[0]?.value || '',
    operator: finalOperators[0]?.value || '==',
    value: "",
    combinator: "AND",
    index: 0,
    ...templateRule,
  };

  const [rules, setRules] = useState<QueryBuilderRule[]>(
    withUniqueKey(initialValue || [finalTemplateRule]) as QueryBuilderRule[]
  );

  useEffect(() => {
    const queries = mergedQueries(
      rules.map((r) => ({
        ...r,
        query: finalOperators.find((o) => o.value === r.operator)?.query(r.field, r.value),
      })),
    );
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: true,
      needsConfiguration: false,
      isFacet: false,
      wantResults: false,
      query: queries,
      value: rules.map((r) => ({
        field: r.field,
        operator: r.operator,
        value: r.value,
        combinator: r.combinator,
        index: r.index,
      })),
      configuration: undefined,
      result: undefined,
    });
  }, [JSON.stringify(rules), dispatch, id, finalOperators]);

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), [dispatch, id]);

  return (
    <div className="react-af-query-builder">
      {rules.map((rule) => (
        <Rule
          combinator={rule.combinator}
          field={rule.field}
          operator={rule.operator}
          value={rule.value}
          fields={processedFields}
          operators={finalOperators}
          combinators={finalCombinators}
          key={rule.key}
          index={rule.index}
          autoComplete={autoComplete}
          onAdd={() => {
            setRules([...rules, { ...finalTemplateRule, index: rules.length, key: uuidv4() }]);
          }}
          onDelete={(index: number) => {
            setRules(
              rules
                .filter((e) => e.index !== index)
                .filter((e) => e)
                .map((v, k) => ({ ...v, index: k })),
            );
          }}
          onChange={(r: QueryBuilderRule) => {
            rules[r.index] = { ...r, key: rules[r.index]?.key };
            setRules([...rules]);
          }}
        />
      ))}
    </div>
  );
}