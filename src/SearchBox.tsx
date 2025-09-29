import React, { useState, useEffect } from "react";
import { useSharedContext } from "./SharedContextProvider";

export interface SearchBoxProps {
  customQuery?: (query?: string) => unknown;
  fields?: string[];
  id: string;
  initialValue?: string;
  placeholder?: string;
  semanticIndexes?: string[];
  limit?: number;
}

export default function SearchBox({
  customQuery,
  fields,
  id,
  initialValue,
  placeholder,
  semanticIndexes,
  limit,
}: SearchBoxProps) {
  const isSemanticEnabled = semanticIndexes && semanticIndexes.length > 0;
  const [{ widgets }, dispatch] = useSharedContext();
  const [value, setValue] = useState(initialValue || "");

  // Update external query on mount.
  useEffect(() => {
    update(value);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If widget value was updated elsewhere (ex: from active filters deletion)
  // We have to update and dispatch the component.
  useEffect(() => {
    const widget = widgets.get(id);
    if (widget && widget.value !== value) {
      update(String(widget.value || ''));
    }
  }, [widgets, id, value]);

  // Build a query from a value.
  function queryFromValue(query: string): unknown {
    if (isSemanticEnabled) return query;
    if (customQuery) {
      return customQuery(query);
    } else if (fields) {
      const termQueries: Array<{ match: string; field: string }> = [];
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
  function update(v: string) {
    setValue(v);
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: true,
      needsConfiguration: isSemanticEnabled,
      isFacet: false,
      isSemantic: isSemanticEnabled,
      wantResults: false,
      query: isSemanticEnabled ? (customQuery ? customQuery() : null) : queryFromValue(v),
      semanticQuery: isSemanticEnabled ? v : undefined,
      value: v,
      configuration: isSemanticEnabled
        ? { indexes: semanticIndexes || [], limit: limit || 10 }
        : undefined,
      result: undefined,
    });
  }

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), [dispatch, id]);

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