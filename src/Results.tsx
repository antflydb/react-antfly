import React, { useEffect, useState, ReactNode } from "react";
import { useSharedContext } from "./SharedContextProvider";
import Pagination from "./Pagination";

export interface ResultsProps {
  itemsPerPage?: number;
  initialPage?: number;
  pagination?: (
    total: number,
    itemsPerPage: number,
    page: number,
    setPage: (page: number) => void
  ) => ReactNode;
  stats?: (total: number) => ReactNode;
  items: (data: unknown[]) => ReactNode;
  id: string;
  sort?: unknown;
}

export default function Results({
  itemsPerPage = 10,
  initialPage = 1,
  pagination,
  stats,
  items,
  id,
  sort,
}: ResultsProps) {
  const [{ widgets }, dispatch] = useSharedContext();
  const [initialization, setInitialization] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [lastQueryHash, setLastQueryHash] = useState<string | null>(null);

  const widget = widgets.get(id);
  const data = widget && widget.result && widget.result.data ? widget.result.data : [];
  const total =
    widget && widget.result && widget.result.total
      ? typeof widget.result.total === 'object' && widget.result.total !== null && 'value' in widget.result.total
        ? (widget.result.total as { value: number }).value
        : (widget.result.total as number)
      : 0;

  // Check if any search widgets have semantic search enabled
  console.log('All widgets:', Array.from(widgets.values()).map(w => ({
    id: w.id,
    isSemantic: w.isSemantic,
    query: w.query,
    value: w.value
  })));

  const isSemanticSearchActive = Array.from(widgets.values()).some((w) =>
    w.isSemantic &&
    w.semanticQuery &&
    typeof w.semanticQuery === 'string' &&
    w.semanticQuery.trim().length > 0
  );
  console.log('isSemanticSearchActive:', isSemanticSearchActive);

  useEffect(() => {
    // Create a hash of all search/filter widgets to detect query changes
    const queryWidgets = Array.from(widgets.values()).filter((w) => w.needsQuery);
    const queryHash = JSON.stringify(
      queryWidgets.map((w) => ({ id: w.id, value: w.value, query: w.query }))
    );

    // Only reset to page 1 if the query actually changed (not just pagination)
    if (queryHash !== lastQueryHash) {
      setPage(initialization ? initialPage : 1);
      setLastQueryHash(queryHash);
    }

    return () => setInitialization(false);
  }, [widgets, total, initialPage, lastQueryHash, initialization]);

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
      query: null,
      value: null,
      configuration: { itemsPerPage, page, sort },
      result: data && total ? { data, total } : undefined,
    });
  }, [dispatch, id, itemsPerPage, page, sort, isSemanticSearchActive, data, total]);

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
      {stats ? stats(total) : (
        (console.log('Rendering with isSemanticSearchActive:', isSemanticSearchActive), isSemanticSearchActive) ?
          <>{data.length} out of {total} results</> :
          <>{total} results</>
      )}
      <div className="react-af-results-items">{items(data)}</div>
      {!isSemanticSearchActive && (pagination ? pagination(total, itemsPerPage, page, setPage) : defaultPagination())}
    </div>
  );
}