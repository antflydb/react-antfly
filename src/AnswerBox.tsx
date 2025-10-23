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
  children,
  buttonLabel = "Submit",
  onSubmit,
}: AnswerBoxProps) {
  const isSemanticEnabled = semanticIndexes && semanticIndexes.length > 0;
  const [, dispatch] = useSharedContext();
  const [value, setValue] = useState(() => initialValue || "");

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
        configuration: isSemanticEnabled
          ? { indexes: semanticIndexes || [], limit: limit || 10 }
          : undefined,
        result: undefined,
      });
    },
    [dispatch, id, isSemanticEnabled, customQuery, queryFromValue, semanticIndexes, limit],
  );

  // Handle input changes (only update local state, don't trigger query)
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Call custom onSubmit callback if provided
      if (onSubmit) {
        onSubmit(value);
      }

      // Update widget state and trigger query
      update(value);
    },
    [value, update, onSubmit],
  );

  // Handle Enter key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();

        // Call custom onSubmit callback if provided
        if (onSubmit) {
          onSubmit(value);
        }

        // Update widget state and trigger query
        update(value);
      }
    },
    [value, update, onSubmit],
  );

  // Destroy widget from context on unmount
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), [dispatch, id]);

  return (
    <div className="react-af-answerbox">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Ask a question..."}
        />
        <button type="submit" disabled={!value.trim()}>
          {buttonLabel}
        </button>
      </form>
      {children}
    </div>
  );
}
