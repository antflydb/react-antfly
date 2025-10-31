import React, { useState } from "react";
import { Antfly, SearchBox, Results, Facet, FacetProps } from "../src";
import { url, tableName } from "./utils";

export default {
  title: "Facet",
  component: Facet,
};

function CollapsableFacet({ title, ...rest }: { title: string } & FacetProps) {
  const [collapsed, setCollapsed] = useState(true);

  function FacetWrapper() {
    if (!collapsed) {
      return <Facet {...rest} />;
    }
    return <div />;
  }
  return (
    <div>
      <div>
        {title}
        <button
          onClick={() => {
            setCollapsed(!collapsed);
          }}
        >
          open
        </button>
      </div>
      {FacetWrapper()}
    </div>
  );
}

export const Collapsable = () => {
  return (
    <Antfly url={url} table={tableName}>
      <SearchBox id="main" fields={["TICO"]} />
      <CollapsableFacet title="Author" id="autr" fields={["AUTR"]} />
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

export const Customized = () => {
  return (
    <Antfly url={url} table={tableName}>
      <Facet
        seeMore="SEE MORE CUSTOM"
        placeholder="MY PLACEHOLDER"
        id="autr"
        fields={["AUTR"]}
        itemsPerBlock={10}
      />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _id, _score }) => (
            <div key={_id}>
              {String(_source?.TICO)} - score: {_score}
            </div>
          ))
        }
      />
    </Antfly>
  );
};

export const ModifyFilterValue = () => {
  return (
    <Antfly url={url} table={tableName}>
      <Facet
        filterValueModifier={(v) => `${v}.*`}
        placeholder="type first letters"
        id="autr"
        fields={["AUTR"]}
      />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source, _id, _score }) => (
            <div key={_id}>
              {String(_source?.TICO)} - score: {_score}
            </div>
          ))
        }
      />
    </Antfly>
  );
};

export const FacetWithCustomRenderItems = () => {
  return (
    <Antfly url={url} table={tableName}>
      <SearchBox id="main" fields={["TICO"]} />
      <Facet
        id="autr"
        fields={["AUTR"]}
        items={(data, { handleChange, isChecked }) => {
          return data.map((item) => (
            <div
              style={{ color: isChecked(item) ? "green" : "black" }}
              onClick={() => handleChange(item, !isChecked(item))}
              key={item.term}
            >
              -`{">"}` {item.term}
            </div>
          ));
        }}
      />
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
