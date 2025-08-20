import React, { useState, useEffect } from "react";
import { Antfly, Results } from "../src";
import { url } from "./utils";

export default {
  title: "Results",
  component: Results,
};

export const Vanilla = () => {
  return (
    <Antfly url={url}>
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _id, _score }) => (
            <div key={_id}>
              <b>{_source.TICO}</b> - score: {_score} - id: {_id}
            </div>
          ))
        }
      />
    </Antfly>
  );
};

export const WithCustomPagination = () => {
  return (
    <Antfly url={url}>
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _id, _score }) => (
            <div key={_id}>
              <b>{_source.TICO}</b> - score: {_score} - id: {_id}
            </div>
          ))
        }
        pagination={(total, itemsPerPage, page) => (
          <div style={{ color: "green" }}>
            Total : {total} - ItemsPerPage : {itemsPerPage} - Page: {page} CUSTOM!
          </div>
        )}
      />
    </Antfly>
  );
};

export const WithCustomStats = () => {
  return (
    <Antfly url={url}>
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _id, _score }) => (
            <div key={_id}>
              <b>{_source.TICO}</b> - score: {_score} - id: {_id}
            </div>
          ))
        }
        stats={(total) => <div style={{ color: "green" }}>{total} results CUSTOM!</div>}
      />
    </Antfly>
  );
};

export const SortableDmisDesc = () => {
  const [sortKey, setSortKey] = useState("DMIS");
  const [sortOrder, setSortOrder] = useState("desc");
  const [sortQuery, setSortQuery] = useState([{ [sortKey]: { order: sortOrder } }]);

  useEffect(() => {
    setSortQuery({ [sortKey]: sortOrder == "desc" });
  }, [sortKey, sortOrder]);

  return (
    <Antfly url={url}>
      Sort by:{" "}
      <select onChange={(e) => setSortKey(e.target.value)} value={sortKey}>
        {["AUTR", "DMIS", "DMAJ", "TICO"].map((e) => (
          <option key={e} value={e}>
            {e.replace(".keyword", "")}
          </option>
        ))}
      </select>
      <select onChange={(e) => setSortOrder(e.target.value)} value={sortOrder}>
        <option value="asc">asc</option>
        <option value="desc">desc</option>
      </select>
      <Results
        id="result"
        sort={sortQuery}
        items={(data) =>
          data.map(({ _source, _id }) => (
            <div key={_id}>
              {_source.DMIS} - {_source.TICO.substr(0, 50)}
            </div>
          ))
        }
      />
    </Antfly>
  );
};
