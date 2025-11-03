import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { useSharedContext } from "./SharedContext";
import { disjunctsFrom } from "./utils";

export interface AnswerBoxProps {
  customQuery?: (query?: string) => unknown;
  fields?: string[];
  id: string;
  initialValue?: string;
  placeholder?: string;
  semanticIndexes?: string[];
  limit?: number;
  table?: string; // Optional table override (Phase 1: single table only)
  filterQuery?: Record<string, unknown>; // Filter query to constrain search results
  exclusionQuery?: Record<string, unknown>; // Exclusion query to exclude matches
  children?: ReactNode;
  buttonLabel?: string;
  onSubmit?: (value: string) => void;
}

export default function AnswerBox({
  customQuery,
  fields,
  id,
  initialValue,
  placeholder,
  semanticIndexes,
  limit,
  table,
  filterQuery,
  exclusionQuery,
  children,
  buttonLabel = "Submit",
  onSubmit,
}: AnswerBoxProps) {
  const isSemanticEnabled = semanticIndexes && semanticIndexes.length > 0;
  const [, dispatch] = useSharedContext();
  const [value, setValue] = useState(() => initialValue || "");
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

  // This function updates the widget state and dispatches to context.
  // Only called on submit, not on every keystroke.
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
        submittedAt: Date.now(), // Timestamp to track when this query was submitted
        table: table,
        filterQuery: filterQuery,
        exclusionQuery: exclusionQuery,
        configuration: isSemanticEnabled
          ? { indexes: semanticIndexes || [], limit: limit || 10 }
          : undefined,
        result: undefined,
      });
    },
    [dispatch, id, isSemanticEnabled, customQuery, queryFromValue, semanticIndexes, limit, table, filterQuery, exclusionQuery],
  );

  // Handle input changes (only update local state, don't trigger query)
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      // Open autosuggest if there are children (Autosuggest component)
      if (children && e.target.value) {
        setIsSuggestOpen(true);
      }
    },
    [children],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Close autosuggest dropdown on submit
      setIsSuggestOpen(false);

      // Call custom onSubmit callback if provided
      if (onSubmit) {
        onSubmit(value);
      }

      // Update widget state and trigger query
      update(value);
    },
    [value, update, onSubmit],
  );

  // Handle clear button click
  const handleClear = useCallback(() => {
    setValue("");
    // Clear the widget state
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: false,
      needsConfiguration: false,
      isFacet: false,
      rootQuery: true,
      isSemantic: isSemanticEnabled,
      wantResults: false,
      query: null,
      semanticQuery: undefined,
      value: "",
      submittedAt: Date.now(),
      table: table,
      filterQuery: filterQuery,
      exclusionQuery: exclusionQuery,
      configuration: undefined,
      result: undefined,
    });
  }, [dispatch, id, isSemanticEnabled, table, filterQuery, exclusionQuery]);

  // Handle autosuggest selection (fills input without submitting)
  const handleSuggestionSelect = useCallback((hit: unknown) => {
    // Extract text from the hit
    let suggestionText = "";

    if (hit && typeof hit === "object") {
      const suggestion = hit as { _source?: Record<string, unknown>; _id?: string };

      // Try to use fields from the AnswerBox configuration
      const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");

      if (firstField && suggestion._source?.[firstField]) {
        suggestionText = String(suggestion._source[firstField]);
      } else if (!fields || fields.length === 0) {
        // When no fields specified, try common field names
        const commonTextFields = ["question", "title", "name", "label", "text", "description", "content"];
        const sourceFields = suggestion._source ? Object.keys(suggestion._source) : [];

        for (const commonField of commonTextFields) {
          if (suggestion._source?.[commonField]) {
            suggestionText = String(suggestion._source[commonField]);
            break;
          }
        }

        // If no common field found, use first available field
        if (!suggestionText && sourceFields.length > 0) {
          const firstAvailableField = sourceFields[0];
          const fieldValue = suggestion._source?.[firstAvailableField];
          if (fieldValue && typeof fieldValue !== "object") {
            suggestionText = String(fieldValue);
          }
        }
      }

      // For facet selections (hits with empty _source), use _id as the term
      if (!suggestionText && suggestion._id) {
        suggestionText = String(suggestion._id);
      }
    }

    if (suggestionText) {
      setValue(suggestionText);
      setIsSuggestOpen(false);
    }
  }, [fields]);

  // Handle Enter and Esc key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();

        // Close autosuggest dropdown on submit
        setIsSuggestOpen(false);

        // Call custom onSubmit callback if provided
        if (onSubmit) {
          onSubmit(value);
        }

        // Update widget state and trigger query
        update(value);
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      }
    },
    [value, update, onSubmit, handleClear],
  );

  // Destroy widget from context on unmount
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), [dispatch, id]);

  return (
    <div className="react-af-answerbox" ref={containerRef}>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask a question..."}
        />
        {value && (
          <button
            type="button"
            className="react-af-answerbox-clear"
            onClick={handleClear}
            aria-label="Clear input"
          >
            ×
          </button>
        )}
        <button type="submit" className="react-af-answerbox-submit" disabled={!value.trim()}>
          {buttonLabel}
        </button>
      </form>
      {children &&
        React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // Only clone props onto custom components (not native DOM elements)
            if (typeof child.type === "function" || typeof child.type === "object") {
              return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
                // Pass searchValue only when autosuggest should be open
                // This prevents autosuggest from querying after form submission
                searchValue: isSuggestOpen ? value : "",
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
