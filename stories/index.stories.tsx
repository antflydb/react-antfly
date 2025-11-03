import React, { useState } from "react";
import {
  Antfly,
  SearchBox,
  Facet,
  Results,
  ActiveFilters,
  toUrlQueryString,
  fromUrlQueryString,
} from "../src";
import { customQuery, customQueryMovie, url, tableName } from "./utils";

export default {
  title: "Antfly",
  component: Antfly,
};

export const BasicUsage = () => {
  return (
    <Antfly url={url} table={tableName}>
      <SearchBox id="main" customQuery={customQuery} />
      <div style={{ display: "inline-block" }}>
        <Facet id="author" fields={["AUTR"]} />
      </div>
      <div style={{ display: "inline-block" }}>
        <Facet id="domn" fields={["DOMN"]} />
      </div>
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _score, _id }) => (
            <div key={_id}>
              <b>{String(_source?.TICO)}</b> - score: {String(_score)}
            </div>
          ))
        }
      />
    </Antfly>
  );
};

export const SemanticSearch = () => {
  return (
    <Antfly url={url} table={tableName}>
      <SearchBox id="main" semanticIndexes={["tico_embeddings"]} limit={10} />
      <div style={{ display: "inline-block" }}>
        <Facet id="author" fields={["AUTR"]} />
      </div>
      <div style={{ display: "inline-block" }}>
        <Facet id="domn" fields={["DOMN"]} />
      </div>
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _score, _id }) => (
            <div key={_id}>
              <b>{String(_source?.TICO)}</b> - score: {String(_score)}
            </div>
          ))
        }
      />
    </Antfly>
  );
};

export const WithUrlParams = () => {
  const [queryString, setQueryString] = useState("");

  const initialValues = fromUrlQueryString("main=%22de%22&resultPage=2");
  return (
    <Antfly
      url={url}
      table={tableName}
      onChange={(values) => {
        setQueryString(toUrlQueryString(values));
      }}
    >
      <div>Params: {queryString}</div>
      <SearchBox id="main" fields={["TICO"]} initialValue={initialValues.get("main") as string} />
      <hr />
      <Facet id="author" fields={["AUTR"]} />
      <ActiveFilters />
      <Results
        id="result"
        initialPage={initialValues.get("resultPage") as number}
        items={(data) =>
          data.map(({ _source, _id }) => <div key={_id}>{String(_source?.TICO)}</div>)
        }
      />
    </Antfly>
  );
};

export const Wikipedia = () => {
  return (
    <Antfly url={"http://localhost:8080"} table="wikipedia">
      <SearchBox id="main" semanticIndexes={["tico_embeddings"]} limit={10} />
      <ActiveFilters />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _id }) => (
            <div key={_id}>
              <a href={String(_source?.url)} target="_blank" rel="noopener noreferrer">
                {String(_source?.title)}
              </a>
            </div>
          ))
        }
      />
    </Antfly>
  );
};

export const MovieDatabase = () => {
  return (
    <Antfly
      url={"https://localhost:8080"}
      table="movies"
      headers={{
        Authorization: "Basic " + window.btoa("Qq38oEj7D:a23804f8-f0c4-4dea-9a55-67739275e588"),
      }}
    >
      <SearchBox id="main" customQuery={customQueryMovie} />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _score, _id }) => (
            <div key={_id}>
              <img src={String(_source?.poster_path)} alt={String(_source?.original_title)} />
              <b>
                {String(_source?.original_title)} - {String(_source?.tagline)}
              </b>{" "}
              - score: {_score}
            </div>
          ))
        }
      />
    </Antfly>
  );
};
