import React from "react";
import { Antfly, SearchBox, Results, CustomWidget } from "../src";
import { url } from "./utils";

export default {
  title: "CustomWidget",
  component: CustomWidget,
};

function MyComponent({ ctx }) {
  let query;
  if (ctx.widgets.get("main")) {
    query = ctx.widgets.get("main").query;
  } else {
    query = "";
  }
  return <div>Main query : {JSON.stringify(query)}</div>;
}

export const Active = () => {
  return (
    <Antfly url={url}>
      <SearchBox id="main" fields={["AUTR"]} />
      <CustomWidget>
        <MyComponent />
      </CustomWidget>
      <Results
        id="result"
        items={(data) => data.map(({ _source: s, _id }) => <div key={_id}>{s.TICO}</div>)}
        pagination={() => <></>}
      />
    </Antfly>
  );
};
