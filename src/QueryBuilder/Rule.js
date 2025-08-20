import React, { useState, useEffect } from "react";
import Autosuggest from "react-autosuggest";
import { useSharedContext } from "../SharedContextProvider";
import { msearch } from "../utils";

export default function Rule({ fields, operators, combinators, ...props }) {
  fields = fields.map((f) => {
    if (f?.endsWith?.(".keyword")) f = f.replace(/\.keyword$/, "");
    return f;
  });
  const [{ url, headers }] = useSharedContext();
  const [combinator, setCombinator] = useState(props.combinator);
  const [field, setField] = useState(props.field);
  const [operator, setOperator] = useState(props.operator);
  const [value, setValue] = useState(props.value);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    props.onChange({ field, operator, value, combinator, index: props.index });
  }, [field, operator, value, combinator]);

  const combinatorElement = props.index ? (
    <select
      className="react-af-rule-combinator"
      value={combinator}
      onChange={(e) => setCombinator(e.target.value)}
    >
      {combinators.map((c) => (
        <option key={c.value} value={c.value}>
          {c.text}
        </option>
      ))}
    </select>
  ) : null;

  const deleteButton = props.index ? (
    <button className="react-af-rule-delete" onClick={() => props.onDelete(props.index)}>
      x
    </button>
  ) : null;

  let input = null;
  if (operators.find((o) => o.value === operator && o.useInput)) {
    // Autocomplete zone.
    if (props.autoComplete && !Array.isArray(field)) {
      input = (
        <Autosuggest
          suggestions={suggestions}
          onSuggestionsFetchRequested={async ({ value }) => {
            let query;
            const suggestionQuery = operators.find((o) => o.value === operator).suggestionQuery;
            if (suggestionQuery) {
              query = suggestionQuery(field, value);
            } else {
              // const terms = { field, include: `.*${value}.*`, order: { _count: "desc" }, size: 10 };
              // query = { query: { match_all: {} }, aggs: { [field]: { terms } }, size: 0 };
              const disjuncts = value
                .toLowerCase()
                .split(" ")
                .map((v) => [
                  { field, prefix: `${v}`, boost: 2 },
                  { field, regexp: `.*${v}.*`, boost: 1.5 },
                ])
                .flat();
              // const disjuncts = [
              //   { field, prefix: `${value.toLowerCase()}`, boost: 2 },
              //   { field, regexp: `.*${value.toLowerCase()}.*`, boost: 1.5 },
              // ];
              query = {
                // Bleve's default analyzer is case insensitive.
                full_text_search: { disjuncts },
                limit: 10,
              };
            }
            const suggestions = await msearch(
              url,
              [{ query, id: "queryBuilder", fields: [field] }],
              headers,
            );
            const response = suggestions.responses[0];
            if (response.status !== 200) {
              console.error(response.error);
              return;
            }
            setSuggestions(response.hits.hits?.map((e) => e._source[field]) || []);
          }}
          onSuggestionsClearRequested={() => setSuggestions([])}
          getSuggestionValue={(suggestion) => suggestion}
          renderSuggestion={(suggestion) => <div>{suggestion}</div>}
          inputProps={{
            value,
            onChange: (event, { newValue }) => setValue(newValue),
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
        value={fields.findIndex((e) => String(e.value) === String(field))}
        onChange={(e) => setField(fields[e.target.value].value)}
      >
        {fields.map((f, k) => {
          return (
            <option key={k} value={k}>
              {f.text}
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
      <button className="react-af-rule-add" onClick={props.onAdd}>
        +
      </button>
      {deleteButton}
    </div>
  );
}
