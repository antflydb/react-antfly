import React, { useEffect, useState } from "react";
import { useSharedContext } from "./SharedContextProvider.jsx";
import Pagination from "./Pagination.jsx";

// Pagination, informations about results (like "30 results")
// and size (number items per page) are customizable.
export default function Results({
  itemsPerPage = 10,
  initialPage = 1,
  pagination,
  stats,
  items,
  id,
  sort,
}) {
  const [{ widgets }, dispatch] = useSharedContext();
  const [initialization, setInitialization] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [lastQueryHash, setLastQueryHash] = useState(null);
  const widget = widgets.get(id);
  const data = widget && widget.result && widget.result.data ? widget.result.data : [];
  const total =
    widget && widget.result && widget.result.total
      ? widget.result.total.hasOwnProperty("value")
        ? widget.result.total.value
        : widget.result.total
      : 0;

  // Check if any search widgets have semantic search enabled
  console.log('All widgets:', Array.from(widgets.values()).map(w => ({ id: w.id, isSemantic: w.isSemantic, query: w.query, value: w.value })));
  const isSemanticSearchActive = Array.from(widgets.values()).some((w) => w.isSemantic && w.query && w.query.trim().length > 0);
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
  }, [widgets, total]);

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
      result: data && total ? { data, total } : null,
    });
  }, [page, sort, isSemanticSearchActive]);

  // Destroy widget from context (remove from the list to unapply its effects)
  useEffect(() => () => dispatch({ type: "deleteWidget", key: id }), []);

  const defaultPagination = () => (
    <Pagination
      onChange={(p) => setPage(p)}
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
