import React, { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useSharedContext } from "./SharedContextProvider";

export interface AutosuggestProps {
  fields: string[];
  limit?: number;
  minChars?: number;
  renderSuggestion?: (suggestion: string, count?: number) => ReactNode;
  customQuery?: (value: string, fields: string[]) => unknown;
  // Internal props passed from SearchBox
  searchValue?: string;
  onSuggestionSelect?: (value: string) => void;
}

interface Suggestion {
  key: string;
  doc_count: number;
}

export default function Autosuggest({
  fields,
  limit = 10,
  minChars = 2,
  renderSuggestion,
  customQuery,
  searchValue = "",
  onSuggestionSelect,
}: AutosuggestProps) {
  const [{ widgets }, dispatch] = useSharedContext();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const id = useRef(`autosuggest-${Math.random().toString(36).slice(2, 11)}`).current;

  // Get suggestions from widget result
  const widget = widgets.get(id);
  const suggestions: Suggestion[] = (widget?.result?.data as Suggestion[]) || [];

  // Update widget configuration when searchValue changes
  useEffect(() => {
    const shouldShow = searchValue.length >= minChars;
    setIsOpen(shouldShow);
    setSelectedIndex(-1);

    if (shouldShow) {
      // Register widget to fetch facet suggestions
      dispatch({
        type: "setWidget",
        key: id,
        needsQuery: customQuery ? true : false,
        needsConfiguration: true,
        isFacet: true,
        wantResults: false,
        query: customQuery ? customQuery(searchValue, fields) : undefined,
        configuration: {
          fields,
          size: limit,
          filterValue: customQuery ? undefined : searchValue,
          useCustomQuery: !!customQuery,
        },
        result: undefined,
      });
    } else {
      // Clear suggestions when search value is too short
      dispatch({
        type: "setWidget",
        key: id,
        needsQuery: false,
        needsConfiguration: false,
        isFacet: false,
        wantResults: false,
        result: { data: [], total: 0 },
      });
    }
  }, [searchValue, fields, limit, minChars, customQuery, dispatch, id]);

  // Cleanup on unmount
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), [dispatch, id]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            onSuggestionSelect?.(suggestions[selectedIndex].key);
            setIsOpen(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, onSuggestionSelect]
  );

  // Attach keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      onSuggestionSelect?.(suggestion);
      setIsOpen(false);
      setSelectedIndex(-1);
    },
    [onSuggestionSelect]
  );

  // Default suggestion renderer
  const defaultRenderSuggestion = (suggestion: string, count?: number) => (
    <>
      <span className="react-af-autosuggest-term">{suggestion}</span>
      {count !== undefined && (
        <span className="react-af-autosuggest-count">{count}</span>
      )}
    </>
  );

  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <ul className="react-af-autosuggest" ref={suggestionsRef}>
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion.key}
          className={`react-af-autosuggest-item ${
            index === selectedIndex ? "react-af-autosuggest-item-selected" : ""
          }`}
          onClick={() => handleSuggestionClick(suggestion.key)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {renderSuggestion
            ? renderSuggestion(suggestion.key, suggestion.doc_count)
            : defaultRenderSuggestion(suggestion.key, suggestion.doc_count)}
        </li>
      ))}
    </ul>
  );
}