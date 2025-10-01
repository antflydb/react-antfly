import React, { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useSharedContext } from "./SharedContextProvider";
import { QueryHit, TermFacetResult } from "@antfly/sdk";

export interface AutosuggestProps {
  fields: string[];
  limit?: number;
  minChars?: number;
  renderSuggestion?: (suggestion: string, count?: number) => ReactNode;
  customQuery?: (value: string, fields: string[]) => unknown;
  // Internal props passed from SearchBox
  searchValue?: string;
  onSuggestionSelect?: (value: string) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export default function Autosuggest({
  fields,
  limit = 10,
  minChars = 2,
  renderSuggestion,
  customQuery,
  searchValue = "",
  onSuggestionSelect,
  containerRef,
}: AutosuggestProps) {
  const [{ widgets }, dispatch] = useSharedContext();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const justSelectedRef = useRef(false);
  const id = useRef(`autosuggest-${Math.random().toString(36).slice(2, 11)}`).current;

  // Get suggestions from widget result
  const widget = widgets.get(id);
  const rawData = (widget?.result?.data as QueryHit[]) || [];

  // Transform hits into suggestions by extracting field values and counting occurrences
  const suggestions: TermFacetResult[] =
    rawData.length > 0
      ? (() => {
          const suggestionMap = new Map<string, number>();

          rawData.forEach((hit: QueryHit) => {
            fields.forEach((field) => {
              // Strip __2gram and __keyword suffixes to get the actual field name in _source
              const sourceField = field.replace(/\_\_(2gram|keyword)$/, "");
              const value = hit._source?.[sourceField];
              if (value) {
                const stringValue = String(value);
                suggestionMap.set(stringValue, (suggestionMap.get(stringValue) || 0) + 1);
              }
            });
          });

          return Array.from(suggestionMap.entries())
            .map(([term, count]) => ({ term, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
        })()
      : [];

  // Update widget configuration when searchValue changes
  useEffect(() => {
    const shouldShow = searchValue.length >= minChars;

    // Don't reopen if user just selected a suggestion
    if (!justSelectedRef.current) {
      setIsOpen(shouldShow);
    }
    justSelectedRef.current = false;

    setSelectedIndex(-1);

    if (shouldShow) {
      // Register widget to fetch its own query results
      dispatch({
        type: "setWidget",
        key: id,
        needsQuery: true,
        needsConfiguration: true,
        isFacet: false,
        rootQuery: true,
        isAutosuggest: true,
        wantResults: true,
        query: customQuery
          ? customQuery(searchValue, fields)
          : {
              disjuncts: fields.map((field) => ({
                match: searchValue,
                field,
              })),
            },
        configuration: {
          fields,
          size: limit,
          itemsPerPage: limit,
          page: 1,
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
        rootQuery: true,
        isAutosuggest: true,
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
            justSelectedRef.current = true;
            onSuggestionSelect?.(suggestions[selectedIndex].term);
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
    [isOpen, suggestions, selectedIndex, onSuggestionSelect],
  );

  // Attach keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Handle click outside to close autosuggest
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef?.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, containerRef]);

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
      justSelectedRef.current = true;
      onSuggestionSelect?.(suggestion);
      setIsOpen(false);
      setSelectedIndex(-1);
    },
    [onSuggestionSelect],
  );

  // Default suggestion renderer
  const defaultRenderSuggestion = (suggestion: string) => (
    <span className="react-af-autosuggest-term">{suggestion}</span>
  );

  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <ul className="react-af-autosuggest" ref={suggestionsRef}>
      {suggestions.map((suggestion, index) => (
        <li
          key={suggestion.term}
          className={`react-af-autosuggest-item ${
            index === selectedIndex ? "react-af-autosuggest-item-selected" : ""
          }`}
          onClick={() => handleSuggestionClick(suggestion.term)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {renderSuggestion
            ? renderSuggestion(suggestion.term, suggestion.count)
            : defaultRenderSuggestion(suggestion.term)}
        </li>
      ))}
    </ul>
  );
}
