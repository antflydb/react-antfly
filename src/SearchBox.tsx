import React, { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useSharedContext } from "./SharedContext";
import { disjunctsFrom } from "./utils";
import { QueryHit } from "@antfly/sdk";

export interface SearchBoxProps {
  customQuery?: (query?: string) => unknown;
  fields?: string[];
  id: string;
  initialValue?: string;
  placeholder?: string;
  semanticIndexes?: string[];
  limit?: number;
  table?: string; // Optional table override (Phase 1: single table only)
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
  table,
  children,
}: SearchBoxProps) {
  const isSemanticEnabled = semanticIndexes && semanticIndexes.length > 0;
  const [{ widgets }, dispatch] = useSharedContext();
  const [value, setValue] = useState(initialValue || "");
  const isExternalUpdate = useRef(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [containerRefObject] = useState<{ current: HTMLDivElement | null }>({ current: null });
  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      // eslint-disable-next-line react-hooks/immutability
      containerRefObject.current = node;
    },
    [containerRefObject],
  );

  // Build a query from a value.
  const queryFromValue = useCallback(
    (query: string): unknown => {
      if (isSemanticEnabled) return query;
      if (customQuery) {
        return customQuery(query);
      } else if (fields) {
        const termQueries: Array<{ match: string; field: string }> = [];
        fields.forEach((field) => {
          termQueries.push({ match: query, field });
        });
        return query ? disjunctsFrom(termQueries) : { match_all: {} };
      }
      return { match_all: {} };
    },
    [isSemanticEnabled, customQuery, fields],
  );

  // This functions updates the current values, then dispatch
  // the new widget properties to context.
  // Called on mount and value change.
  const update = useCallback(
    (v: string) => {
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
        table: table,
        configuration: isSemanticEnabled
          ? { indexes: semanticIndexes || [], limit: limit || 10 }
          : undefined,
        result: undefined,
      });
    },
    [dispatch, id, isSemanticEnabled, customQuery, queryFromValue, semanticIndexes, limit, table],
  );

  // Update external query on mount - always initialize the widget
  useEffect(() => {
    const valueToSet = initialValue || "";
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
      setValue(String(widgetValue || ""));
      isExternalUpdate.current = false;
    }
  }, [widgetValue, value, id]);

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      update(newValue);
      // If user is typing, autosuggest will open
      if (newValue.trim()) {
        setIsSuggestOpen(true);
      }
    },
    [update],
  );

  // Handle clear button click
  const handleClear = useCallback(() => {
    setValue("");
    update("");
    setIsSuggestOpen(false);
  }, [update]);

  // Handle Esc key press - close autosuggest first, then clear on second press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (isSuggestOpen) {
          // First Esc: close autosuggest
          setIsSuggestOpen(false);
        } else if (value) {
          // Second Esc: clear the input
          handleClear();
        }
      }
    },
    [isSuggestOpen, value, handleClear],
  );

  // Handle suggestion selection from Autosuggest
  const handleSuggestionSelect = useCallback(
    (suggestion: QueryHit) => {
      // Close autosuggest when a suggestion is selected
      setIsSuggestOpen(false);

      // If the child component had its own onSuggestionSelect, call it first
      const childProps = React.isValidElement(children)
        ? (children as React.ReactElement<{ onSuggestionSelect?: (hit: QueryHit) => void }>).props
        : {};
      const originalHandler = childProps.onSuggestionSelect;

      if (originalHandler) {
        // Let the custom handler decide what to do (e.g., navigate away)
        originalHandler(suggestion);
        // Don't update search box value if custom handler provided
        return;
      }

      // Default behavior: update search box with selected value
      // Extract value from first field for display in search box
      const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");
      let valueToSet = "";

      if (firstField && suggestion._source?.[firstField]) {
        // Use the specified field if available
        valueToSet = String(suggestion._source[firstField]);
      } else if (!fields || fields.length === 0) {
        // When no fields specified, try to find a reasonable value from the suggestion
        // First try common text fields, then fall back to first available field or _id
        const commonTextFields = ["title", "name", "label", "text", "description"];
        const sourceFields = suggestion._source ? Object.keys(suggestion._source) : [];

        for (const commonField of commonTextFields) {
          if (suggestion._source?.[commonField]) {
            valueToSet = String(suggestion._source[commonField]);
            break;
          }
        }

        // If no common field found, use first available field
        if (!valueToSet && sourceFields.length > 0) {
          const firstAvailableField = sourceFields[0];
          const fieldValue = suggestion._source?.[firstAvailableField];
          if (fieldValue && typeof fieldValue !== "object") {
            valueToSet = String(fieldValue);
          }
        }

        // Last resort: use the document ID
        if (!valueToSet) {
          valueToSet = suggestion._id || "";
        }
      }

      setValue(valueToSet);
      update(valueToSet);
    },
    [update, fields, children],
  );

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), [dispatch, id]);

  return (
    <div className="react-af-searchbox" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "search…"}
      />
      {value && (
        <button
          type="button"
          className="react-af-searchbox-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
      {children &&
        React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // Only clone props onto custom components (not native DOM elements like div, span, etc.)
            // Native DOM elements are represented as strings (e.g., 'div'), while custom components
            // are functions or classes
            if (typeof child.type === "function" || typeof child.type === "object") {
              return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                searchValue: value,
                onSuggestionSelect: handleSuggestionSelect,
                containerRef: containerRefObject,
                isOpen: isSuggestOpen,
                onClose: () => setIsSuggestOpen(false),
              });
            }
          }
          return child;
        })}
    </div>
  );
}
