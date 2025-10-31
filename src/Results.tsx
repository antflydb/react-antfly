import React, { useEffect, useState, ReactNode } from "react";
import { useSharedContext } from "./SharedContext";
import Pagination from "./Pagination";
import { QueryHit } from "@antfly/sdk";

export interface ResultsProps {
  itemsPerPage?: number;
  initialPage?: number;
  pagination?: (
    total: number,
    itemsPerPage: number,
    page: number,
    setPage: (page: number) => void,
  ) => ReactNode;
  stats?: (total: number) => ReactNode;
  items: (data: QueryHit[]) => ReactNode;
  id: string;
  sort?: unknown;
  fields?: string[];
  table?: string; // Optional table override (Phase 1: single table only)
  filterQuery?: Record<string, unknown>; // Filter query to constrain search results
}

export default function Results({
  itemsPerPage = 10,
  initialPage = 1,
  pagination,
  stats,
  items,
  id,
  sort,
  fields,
  table,
  filterQuery,
}: ResultsProps) {
  const [{ widgets }, dispatch] = useSharedContext();
  const [page, setPage] = useState(initialPage);
  const [lastQueryHash, setLastQueryHash] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const widget = widgets.get(id);
  const data = widget && widget.result && widget.result.data ? widget.result.data : [];
  const total =
    widget && widget.result && widget.result.total
      ? typeof widget.result.total === "object" &&
        widget.result.total !== null &&
        "value" in widget.result.total
        ? (widget.result.total as { value: number }).value
        : (widget.result.total as number)
      : 0;

  // Check if any search widgets have semantic search enabled
  const isSemanticSearchActive = Array.from(widgets.values()).some(
    (w) =>
      w.isSemantic &&
      w.semanticQuery &&
      typeof w.semanticQuery === "string" &&
      w.semanticQuery.trim().length > 0,
  );

  // Create a hash of all search/filter widgets to detect query changes
  const queryWidgets = Array.from(widgets.values()).filter((w) => w.needsQuery);
  const queryHash = JSON.stringify(
    queryWidgets.map((w) => ({ id: w.id, value: w.value, query: w.query })),
  );

  // Compute the desired page based on query changes
  const desiredPage = React.useMemo(() => {
    if (queryHash !== lastQueryHash) {
      return !isInitialized ? initialPage : 1;
    }
    return page;
  }, [queryHash, lastQueryHash, isInitialized, initialPage, page]);

  // Update state after query hash changes
  useEffect(() => {
    if (queryHash !== lastQueryHash) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLastQueryHash(queryHash);
      setIsInitialized(true);
      if (desiredPage !== page) {
        setPage(desiredPage);
      }
    }
  }, [queryHash, lastQueryHash, desiredPage, page]);

  // Update context with page (and itemsPerPage)
  useEffect(() => {
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: false,
      needsConfiguration: true,
      isFacet: false,
      wantResults: true,
      isSemantic: isSemanticSearchActive,
      table: table,
      filterQuery: filterQuery,
      configuration: { itemsPerPage, page, sort, fields },
      // Don't pass result here - it should only be set by the Listener after fetching
    });
  }, [dispatch, id, itemsPerPage, page, sort, fields, table, filterQuery, isSemanticSearchActive]); // Remove data and total to prevent loops

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), [dispatch, id]);

  const defaultPagination = () => (
    <Pagination
      onChange={(p: number) => setPage(p)}
      total={total}
      itemsPerPage={itemsPerPage}
      page={page}
    />
  );

  return (
    <div className="react-af-results">
      {stats ? (
        stats(total)
      ) : isSemanticSearchActive ? (
        <>
          {data.length} out of {total} results
        </>
      ) : (
        <>{total} results</>
      )}
      <div className="react-af-results-items">{items(data)}</div>
      {!isSemanticSearchActive &&
        (pagination ? pagination(total, itemsPerPage, page, setPage) : defaultPagination())}
    </div>
  );
}
