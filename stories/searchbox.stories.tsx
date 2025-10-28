import React from "react";
import { Antfly, SearchBox, Results, Autosuggest } from "../src";
import { customQuery, url, tableName } from "./utils";

export default {
  title: "SearchBox",
  component: SearchBox,
};

export const WithDefaultQuery = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Search on AUTR field</h1>
      <pre>{`<SearchBox id="main" fields={["AUTR"]} />`}</pre>
      <SearchBox id="main" fields={["AUTR"]} />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id}>
              {s.TICO} - {s.AUTR}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const WithCustomQuery = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Search on TICO field with custom query</h1>
      <pre>{`<SearchBox id="main" customQuery={customQuery} />`}</pre>
      <SearchBox id="main" customQuery={customQuery} />
      <Results
        id="result"
        items={(data) => data.map(({ _source: s, _id }) => <div key={_id}>{s.TICO}</div>)}
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const WithAutosuggest = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Search with Autocomplete</h1>
      <pre>{`<SearchBox id="main" fields={["AUTR"]}>
  <Autosuggest fields={["AUTR"]} limit={5} minChars={2} />
</SearchBox>`}</pre>
      <SearchBox id="main" fields={["AUTR"]}>
        <Autosuggest fields={["AUTR"]} limit={5} minChars={2} />
      </SearchBox>
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id}>
              {s.TICO} - {s.AUTR}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const WithAutosuggestMultipleFields = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Search with Autocomplete on Multiple Fields</h1>
      <pre>{`<SearchBox id="main" fields={["AUTR", "TICO"]}>
  <Autosuggest fields={["AUTR", "TICO"]} limit={10} />
</SearchBox>`}</pre>
      <SearchBox id="main" fields={["AUTR", "TICO"]}>
        <Autosuggest fields={["AUTR", "TICO"]} limit={10} />
      </SearchBox>
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id}>
              {s.TICO} - {s.AUTR}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const WithAutosuggestCustomRenderer = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Search with Custom Suggestion Rendering</h1>
      <pre>{`<SearchBox id="main" fields={["AUTR"]}>
  <Autosuggest
    fields={["AUTR"]}
    renderSuggestion={(term, count) => (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <strong>{term}</strong>
        <em>({count} results)</em>
      </div>
    )}
  />
</SearchBox>`}</pre>
      <SearchBox id="main" fields={["AUTR"]}>
        <Autosuggest
          fields={["AUTR"]}
          renderSuggestion={(term, count) => (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{term}</strong>
              <em>({count} results)</em>
            </div>
          )}
        />
      </SearchBox>
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id}>
              {s.TICO} - {s.AUTR}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};
