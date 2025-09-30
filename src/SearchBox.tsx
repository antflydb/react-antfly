import React, { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useSharedContext } from "./SharedContextProvider";

export interface SearchBoxProps {
  customQuery?: (query?: string) => unknown;
  fields?: string[];
  id: string;
  initialValue?: string;
  placeholder?: string;
  semanticIndexes?: string[];
  limit?: number;
  children?: ReactNode;
}

export default function SearchBox({
  customQuery,
  fields,
  id,
  initialValue,
  placeholder,
  semanticIndexes,
  limit,
  children,
}: SearchBoxProps) {
  const isSemanticEnabled = semanticIndexes && semanticIndexes.length > 0;
  const [{ widgets }, dispatch] = useSharedContext();
  const [value, setValue] = useState(initialValue || "");
  const isExternalUpdate = useRef(false);

  // Build a query from a value.
  const queryFromValue = useCallback((query: string): unknown => {
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
  }, [isSemanticEnabled, customQuery, fields]);

  // This functions updates the current values, then dispatch
  // the new widget properties to context.
  // Called on mount and value change.
  const update = useCallback((v: string) => {
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: true,
      needsConfiguration: isSemanticEnabled,
      isFacet: false,
      rootQuery: true,
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
  }, [dispatch, id, isSemanticEnabled, customQuery, queryFromValue, semanticIndexes, limit]);

  // Update external query on mount - always initialize the widget
  useEffect(() => {
    const valueToSet = initialValue || '';
    setValue(valueToSet);
    update(valueToSet);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If widget value was updated elsewhere (ex: from active filters deletion)
  // We have to update and dispatch the component.
  const widgetValue = widgets.get(id)?.value;
  useEffect(() => {
    // Only update if the widget value was changed externally
    // and is actually different from our current value
    if (widgetValue !== undefined && widgetValue !== value && !isExternalUpdate.current) {
      isExternalUpdate.current = true;
      setValue(String(widgetValue || ''));
      isExternalUpdate.current = false;
    }
  }, [widgetValue, value, id]);

  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    update(newValue);
  }, [update]);

  // Handle suggestion selection from Autosuggest
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setValue(suggestion);
    update(suggestion);
  }, [update]);

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), [dispatch, id]);

  return (
    <div className="react-af-searchbox">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder || "search…"}
      />
      {children && React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            searchValue: value,
            onSuggestionSelect: handleSuggestionSelect,
          });
        }
        return child;
      })}
    </div>
  );
}