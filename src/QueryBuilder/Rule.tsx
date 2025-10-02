import React, { useState, useEffect } from "react";
import Autosuggest from "react-autosuggest";
import { useSharedContext } from "../SharedContextProvider";
import { msearch, MultiqueryRequest } from "../utils";
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

export default function Rule({
  fields,
  operators,
  combinators,
  combinator: initialCombinator,
  field: initialField,
  operator: initialOperator,
  value: initialValue,
  index,
  autoComplete,
  onAdd,
  onDelete,
  onChange,
}: RuleProps) {
  const processedFields = fields.map((f) => {
    if (typeof f === "string") {
      let field = f;
      return { value: field, text: field };
    }
    return f;
  });

  const [{ url, headers }] = useSharedContext();
  const [combinator, setCombinator] = useState(initialCombinator);
  const [field, setField] = useState(initialField);
  const [operator, setOperator] = useState(initialOperator);
  const [value, setValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    onChange({ field, operator, value, combinator, index });
  }, [field, operator, value, combinator, onChange, index]);

  const combinatorElement =
    index > 0 ? (
      <select
        className="react-af-rule-combinator"
        value={combinator}
        onChange={(e) => setCombinator(e.target.value as "AND" | "OR")}
      >
        {combinators.map((c) => (
          <option key={c.value} value={c.value}>
            {c.text}
          </option>
        ))}
      </select>
    ) : null;

  const deleteButton =
    index > 0 ? (
      <button className="react-af-rule-delete" onClick={() => onDelete(index)}>
        x
      </button>
    ) : null;

  let input = null;
  const currentOperator = operators.find((o) => o.value === operator);
  if (currentOperator && currentOperator.useInput) {
    // Autocomplete zone.
    if (autoComplete && !Array.isArray(field)) {
      input = (
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={async ({ value: suggestValue }: { value: string }) => {
            let query;
            const suggestionQuery = (currentOperator as any).suggestionQuery;
            if (suggestionQuery) {
              query = suggestionQuery(field, suggestValue);
            } else {
              const disjuncts = suggestValue
                .toLowerCase()
                .split(" ")
                .map((v: string) => [
                  { field, prefix: `${v}`, boost: 2 },
                  { field, regexp: `.*${v}.*`, boost: 1.5 },
                ])
                .flat();
              query = {
                // Bleve's default analyzer is case insensitive.
                full_text_search: { disjuncts },
                limit: 10,
              };
            }

            const msearchRequest: MultiqueryRequest[] = [
              {
                query,
              },
            ];

            const suggestions = await msearch(url || "", msearchRequest, headers || {});

            const responses = (suggestions as any)?.responses;
            if (responses && responses[0]) {
              const response = responses[0];
              if (response.status !== 200) {
                console.error(response.error);
                return;
              }
              setSuggestions(response.hits.hits?.map((e: any) => e._source[field]) || []);
            }
          }}
          onSuggestionsClearRequested={() => setSuggestions([])}
          getSuggestionValue={(suggestion: string) => suggestion}
          renderSuggestion={(suggestion: string) => <div>{suggestion}</div>}
          inputProps={{
            value,
            onChange: (event: any, { newValue }: { newValue: string }) => setValue(newValue),
            className: "react-af-rule-value",
            autoComplete: "new-password",
          }}
        />
      );
    } else {
      input = (
        <input
          className="react-af-rule-value"
          value={value}
          autoComplete="new-password"
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }
  }

  return (
    <div className="react-af-rule">
      {combinatorElement}
      <select
        className="react-af-rule-field"
        value={processedFields.findIndex((e) => String(e.value) === String(field))}
        onChange={(e) => setField(processedFields[parseInt(e.target.value)]?.value || "")}
      >
        {processedFields.map((f, k) => {
          return (
            <option key={k} value={k}>
              {f.text || f.value}
            </option>
          );
        })}
      </select>
      <select
        className="react-af-rule-operator"
        value={operator}
        onChange={(e) => setOperator(e.target.value)}
      >
        {operators.map((o) => {
          return (
            <option key={o.value} value={o.value}>
              {o.text}
            </option>
          );
        })}
      </select>
      {input}
      <button className="react-af-rule-add" onClick={onAdd}>
        +
      </button>
      {deleteButton}
    </div>
  );
}
