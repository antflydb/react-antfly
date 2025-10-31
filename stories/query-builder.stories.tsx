import React, { useState } from "react";
import { Antfly, QueryBuilder, Results, fromUrlQueryString, toUrlQueryString, QueryBuilderRule } from "../src";
import { url, tableName } from "./utils";

export default {
  title: "QueryBuilder",
  component: QueryBuilder,
};

export const Simple = () => {
  return (
    <Antfly url={url} table={tableName}>
      <QueryBuilder id="qb" fields={[{ value: "AUTR", text: "Author" }]} />
      <Results
        id="result"
        items={(data) => data.map(({ _source, _id }) => <div key={_id}>{String(_source?.TICO)}</div>)}
      />
    </Antfly>
  );
};

export const AutoComplete = () => {
  return (
    <Antfly url={url} table={tableName}>
      <QueryBuilder id="qb" fields={[{ value: "AUTR", text: "Author" }]} autoComplete={true} />
      <Results
        id="result"
        items={(data) => data.map(({ _source, _id }) => <div key={_id}>{String(_source?.TICO)}</div>)}
      />
    </Antfly>
  );
};

export const CustomQueryAndOperators = () => {
  const regexify = (v: string) =>
    `.*${v
      .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
      .replace(/([A-Z])/gi, (_w: string, x: string) => `[${x.toUpperCase()}${x.toLowerCase()}]`)}.*`;
  const operators = [
    {
      value: "==",
      text: "contains (case insensitive)",
      useInput: true,
      query: (key: string | string[], value?: string) => {
        const field = Array.isArray(key) ? key[0] : key;
        return value ? { field, regexp: regexify(value) } : null;
      },
      suggestionQuery: (field: string, value: string) => {
        return {
          query: { field, regexp: regexify(value) },
          size: 10,
        };
      },
    },
  ];
  return (
    <Antfly url={url} table={tableName}>
      <QueryBuilder
        id="qb"
        fields={[{ value: "AUTR", text: "Author" }]}
        autoComplete={true}
        operators={operators}
      />
      <Results
        id="result"
        items={(data) => data.map(({ _source, _id }) => <div key={_id}>{String(_source?.TICO)}</div>)}
      />
    </Antfly>
  );
};

export const MultipleFields = () => {
  return (
    <Antfly url={url} table={tableName}>
      <QueryBuilder
        id="qb"
        fields={[
          { value: "AUTR", text: "Author" },
          "AUTR",
          "TICO",
        ]}
        autoComplete={true}
      />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _id }) => (
            <div key={_id}>
              {String(_source?.AUTR)} - {String(_source?.TICO)}
            </div>
          ))
        }
      />
    </Antfly>
  );
};

export const ListenChangesWithUrlParams = () => {
  const [queryString, setQueryString] = useState("");

  const initialValues = fromUrlQueryString(
    "qb=%5B%7B%22field%22%3A%22AUTR%22%2C%22operator%22%3A%22%2A%22%2C%22value%22%3A%22jean%22%2C%22combinator%22%3A%22AND%22%2C%22index%22%3A0%7D%2C%7B%22field%22%3A%22AUTR%22%2C%22operator%22%3A%22%2A%22%2C%22value%22%3A%22marc%22%2C%22combinator%22%3A%22OR%22%2C%22index%22%3A1%7D%5D"
  );

  return (
    <Antfly
      url={url}
      table={tableName}
      onChange={(values) => {
        setQueryString(toUrlQueryString(values));
      }}
    >
      <div style={{ wordBreak: "break-all" }}>Params: {queryString}</div>
      <QueryBuilder
        initialValue={initialValues.get("qb") as QueryBuilderRule[] | undefined}
        id="qb"
        fields={[
          { value: "x", text: "Should not be selected" },
          { value: "AUTR", text: "Author" },
        ]}
      />
      <Results
        id="result"
        items={(data) => data.map(({ _source, _id }) => <div key={_id}>{String(_source?.TICO)}</div>)}
      />
    </Antfly>
  );
};
