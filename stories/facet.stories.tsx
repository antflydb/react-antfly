import React, { useState } from "react";
import { Antfly, SearchBox, Results, Facet } from "../src";
import { url } from "./utils";

export default {
  title: "Facet",
  component: Facet,
};

function CollapsableFacet({ title, ...rest }) {
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
    <Antfly url={url}>
      <SearchBox id="main" fields={["TICO"]} />
      <CollapsableFacet id="autr" fields={["AUTR"]} />
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

export const Customized = () => {
  return (
    <Antfly url={url}>
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
              {_source.TICO} - score: {_score}
            </div>
          ))
        }
      />
    </Antfly>
  );
};

export const ModifyFilterValue = () => {
  return (
    <Antfly url={url}>
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
              {_source.TICO} - score: {_score}
            </div>
          ))
        }
      />
    </Antfly>
  );
};

export const FacetWithCustomRenderItems = () => {
  return (
    <Antfly url={url}>
      <SearchBox id="main" fields={["TICO"]} />
      <Facet
        id="autr"
        fields={["AUTR"]}
        items={(data, { handleChange, isChecked }) => {
          return data.map((item) => (
            <div
              style={{ color: isChecked(item) ? "green" : "black" }}
              onClick={() => handleChange(item, !isChecked(item))}
              key={item.key}
            >
              -`{">"}` {item.key}
            </div>
          ));
        }}
      />
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
