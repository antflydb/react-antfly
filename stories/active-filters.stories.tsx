import React from "react";
import { Antfly, SearchBox, Results, ActiveFilters, Facet } from "../src";
import { url, tableName } from "./utils";
import "../src/style.css";

export default {
  title: "ActiveFilters",
  component: ActiveFilters,
};

export const Active = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Display active filters</h1>
      <pre>{`<ActiveFilters />`}</pre>
      Active Filters:
      <ActiveFilters />
      <SearchBox id="main" fields={["TICO"]} initialValue={"chemin"} />
      <Facet id="autr" fields={["AUTR"]} initialValue={["auteur inconnu"]} />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id}>
              {String(s?.TICO)} - {String(s?.AUTR)}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const ActiveFilterChangeComponentOrder = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Active filter (change component order)</h1>
      <Facet id="autr" fields={["AUTR"]} />
      Recherche:
      <SearchBox id="main" fields={["TICO"]} initialValue={"chemin"} />
      Filtres:
      <ActiveFilters />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id}>
              {String(s?.TICO)} - {String(s?.AUTR)}
            </div>
          ))
        }
      />
    </Antfly>
  );
};
