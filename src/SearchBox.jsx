import React, { useState, useEffect } from "react";
import { useSharedContext } from "./SharedContextProvider.jsx";

export default function SearchBox({
  customQuery,
  fields,
  id,
  initialValue,
  placeholder,
  isSemantic,
  semanticIndexes,
  limit,
}) {
  const isSemanticEnabled = semanticIndexes && semanticIndexes.length > 0;
  const [{ widgets }, dispatch] = useSharedContext();
  const [value, setValue] = useState(initialValue || "");

  // Update external query on mount.
  useEffect(() => {
    update(value);
  }, []);

  // If widget value was updated elsewhere (ex: from active filters deletion)
  // We have to update and dispatch the component.
  useEffect(() => {
    widgets.get(id) && update(widgets.get(id).value);
  }, [isValueReady()]);

  // Build a query from a value.
  function queryFromValue(query) {
    if (isSemanticEnabled) return query;
    if (customQuery) {
      return customQuery(query);
    } else if (fields) {
      const termQueries = [];
      fields.forEach((field) => {
        termQueries.push({ match: query, field });
      });
      return query ? { disjuncts: termQueries } : { match_all: {} };
    }
    return { match_all: {} };
  }

  // This functions updates the current values, then dispatch
  // the new widget properties to context.
  // Called on mount and value change.
  function update(v) {
    setValue(v);
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: true,
      needsConfiguration: isSemanticEnabled,
      isFacet: false,
      isSemantic: isSemanticEnabled,
      wantResults: false,
      query: queryFromValue(v),
      value: v,
      configuration: isSemanticEnabled ? { indexes: semanticIndexes || [], limit: limit || 10 } : null,
      result: null,
    });
  }

  // Checks if widget value is the same as actual value.
  function isValueReady() {
    return !widgets.get(id) || widgets.get(id).value == value;
  }

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), []);

  return (
    <div className="react-af-searchbox">
      <input
        type="text"
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder || "search…"}
      />
    </div>
  );
}
