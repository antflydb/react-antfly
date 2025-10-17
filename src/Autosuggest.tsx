import React, { useState, useEffect, useCallback, useRef, ReactNode, useMemo } from "react";
import { useSharedContext } from "./SharedContext";
import { QueryHit } from "@antfly/sdk";
import { disjunctsFrom } from "./utils";

export interface AutosuggestProps {
  fields: string[];
  limit?: number;
  minChars?: number;
  renderSuggestion?: (hit: QueryHit) => ReactNode;
  customQuery?: (value: string, fields: string[]) => unknown;
  // Internal props passed from SearchBox
  searchValue?: string;
  onSuggestionSelect?: (hit: QueryHit) => void;
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

  // Use hits directly as suggestions
  const suggestions: QueryHit[] = useMemo(() => {
    const rawData = (widget?.result?.data as QueryHit[]) || [];
    return rawData.slice(0, limit);
  }, [widget?.result?.data, limit]);

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
          : disjunctsFrom(
              fields.map((field) => {
                // TODO (ajr) Do we want match_phrase or make a match_phrase_prefix?
                // if (field.includes(" ")) return {};
                if (field.endsWith("__keyword")) return { prefix: searchValue, field };
                if (field.endsWith("__2gram")) return { match: searchValue, field };
                return { match: searchValue, field };
              }),
            ),
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
            onSuggestionSelect?.(suggestions[selectedIndex]);
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
    (hit: QueryHit) => {
      justSelectedRef.current = true;
      onSuggestionSelect?.(hit);
      setIsOpen(false);
      setSelectedIndex(-1);
    },
    [onSuggestionSelect],
  );

  // Default suggestion renderer
  const defaultRenderSuggestion = (hit: QueryHit) => {
    // Display first available field value
    const firstField = fields[0]?.replace(/__(2gram|keyword)$/, "");
    const value = hit._source?.[firstField];
    return <span className="react-af-autosuggest-term">{value ? String(value) : hit._id}</span>;
  };

  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  return (
    <ul className="react-af-autosuggest" ref={suggestionsRef}>
      {suggestions.map((hit, index) => (
        <li
          key={hit._id}
          className={`react-af-autosuggest-item ${
            index === selectedIndex ? "react-af-autosuggest-item-selected" : ""
          }`}
          onClick={() => handleSuggestionClick(hit)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          {renderSuggestion ? renderSuggestion(hit) : defaultRenderSuggestion(hit)}
        </li>
      ))}
    </ul>
  );
}
