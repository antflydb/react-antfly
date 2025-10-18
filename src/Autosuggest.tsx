import React, { useState, useEffect, useCallback, useRef, ReactNode, useMemo, useId } from "react";
import { useSharedContext } from "./SharedContext";
import { QueryHit } from "@antfly/sdk";
import { disjunctsFrom } from "./utils";

export interface AutosuggestProps {
  fields?: string[];
  returnFields?: string[];
  limit?: number;
  minChars?: number;
  renderSuggestion?: (hit: QueryHit) => ReactNode;
  customQuery?: (value?: string, fields?: string[]) => unknown;
  semanticIndexes?: string[];
  // Internal props passed from SearchBox
  searchValue?: string;
  onSuggestionSelect?: (hit: QueryHit) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export default function Autosuggest({
  fields,
  returnFields,
  limit = 10,
  minChars = 2,
  renderSuggestion,
  customQuery,
  semanticIndexes,
  searchValue = "",
  onSuggestionSelect,
  containerRef,
}: AutosuggestProps) {
  const isSemanticEnabled = semanticIndexes && semanticIndexes.length > 0;
  // Default returnFields to fields if not specified
  const effectiveReturnFields = returnFields ?? fields;
  const [{ widgets }, dispatch] = useSharedContext();
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isOpenOverride, setIsOpenOverride] = useState<boolean | null>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const justSelectedRef = useRef(false);
  const prevSearchValueRef = useRef(searchValue);
  const id = `autosuggest-${useId()}`;

  // Get suggestions from widget result
  const widget = widgets.get(id);

  // Use hits directly as suggestions
  const suggestions: QueryHit[] = useMemo(() => {
    const rawData = (widget?.result?.data as QueryHit[]) || [];
    return rawData.slice(0, limit);
  }, [widget?.result?.data, limit]);

  // Derive isOpen from searchValue, with ability to override
  const shouldShow = searchValue.length >= minChars;
  const isOpen = isOpenOverride !== null ? isOpenOverride : shouldShow;

  // Update widget configuration when searchValue changes
  useEffect(() => {
    // Reset override and selection when search value changes
    if (prevSearchValueRef.current !== searchValue) {
      prevSearchValueRef.current = searchValue;
      if (!justSelectedRef.current) {
        // Use a microtask to avoid setState during render
        Promise.resolve().then(() => {
          setIsOpenOverride(null);
          setSelectedIndex(-1);
        });
      }
      justSelectedRef.current = false;
    }

    const shouldShowNow = searchValue.length >= minChars;
    if (shouldShowNow) {
      // Determine if this autosuggest can actually query
      // It needs either: semantic indexes, custom query, or non-empty fields
      const canQuery =
        isSemanticEnabled ||
        customQuery !== undefined ||
        (Array.isArray(fields) && fields.length > 0);

      // Register widget to fetch its own query results
      dispatch({
        type: "setWidget",
        key: id,
        needsQuery: canQuery,
        needsConfiguration: canQuery,
        isFacet: false,
        rootQuery: true,
        isAutosuggest: true,
        isSemantic: isSemanticEnabled,
        wantResults: canQuery,
        query: isSemanticEnabled
          ? customQuery
            ? customQuery()
            : null
          : customQuery
            ? customQuery(searchValue, fields)
            : Array.isArray(fields) && fields.length > 0
              ? disjunctsFrom(
                  fields.map((field) => {
                    // TODO (ajr) Do we want match_phrase or make a match_phrase_prefix?
                    // if (field.includes(" ")) return {};
                    if (field.endsWith("__keyword")) return { prefix: searchValue, field };
                    if (field.endsWith("__2gram")) return { match: searchValue, field };
                    return { match: searchValue, field };
                  }),
                )
              : null,
        semanticQuery: isSemanticEnabled ? searchValue : undefined,
        configuration: canQuery
          ? isSemanticEnabled
            ? {
                indexes: Array.isArray(semanticIndexes) ? semanticIndexes : [],
                limit,
                itemsPerPage: limit,
                page: 1,
                fields: effectiveReturnFields,
              }
            : {
                fields: effectiveReturnFields,
                size: limit,
                itemsPerPage: limit,
                page: 1,
              }
          : undefined,
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
        isSemantic: isSemanticEnabled,
        wantResults: false,
        result: { data: [], total: 0 },
      });
    }
  }, [
    searchValue,
    fields,
    limit,
    minChars,
    customQuery,
    dispatch,
    id,
    isSemanticEnabled,
    effectiveReturnFields,
    semanticIndexes,
    shouldShow,
  ]);

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
            setIsOpenOverride(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpenOverride(false);
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
        setIsOpenOverride(false);
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
      setIsOpenOverride(false);
      setSelectedIndex(-1);
    },
    [onSuggestionSelect],
  );

  // Default suggestion renderer
  const defaultRenderSuggestion = (hit: QueryHit) => {
    // Display first available field value
    const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");
    const value = firstField ? hit._source?.[firstField] : undefined;
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
