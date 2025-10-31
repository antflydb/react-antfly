import React from "react";
import { Antfly, SearchBox, Results, CustomWidget } from "../src";
import type { SharedState } from "../src";
import { url, tableName } from "./utils";

export default {
  title: "CustomWidget",
  component: CustomWidget,
};

function MyComponent({ ctx }: { ctx?: SharedState }) {
  let query;
  if (ctx?.widgets.get("main")) {
    query = ctx?.widgets.get("main")?.query;
  } else {
    query = "";
  }
  return <div>Main query : {JSON.stringify(query)}</div>;
}

export const Active = () => {
  return (
    <Antfly url={url} table={tableName}>
      <SearchBox id="main" fields={["AUTR"]} />
      <CustomWidget>
        <MyComponent ctx={{} as SharedState} />
      </CustomWidget>
      <Results
        id="result"
        items={(data) => data.map(({ _source: s, _id }) => <div key={_id}>{String(s?.TICO)}</div>)}
        pagination={() => <></>}
      />
    </Antfly>
  );
};
