import React, { useEffect, useRef, ReactNode } from "react";
import { useSharedContext, Widget } from "./SharedContext";
import { QueryResult, QueryHit, TermFacetResult } from "@antfly/sdk";
import { msearch as multiquery, conjunctsFrom, defer, MultiqueryRequest } from "./utils";

interface ListenerProps {
  children: ReactNode;
  onChange?: (params: Map<string, unknown>) => void;
}

interface SearchWidgetConfig {
  itemsPerPage: number;
  page: number;
  sort?: string;
  fields?: string[];
}

interface FacetWidgetConfig {
  fields: string[];
  size: number;
  filterValue?: string;
  useCustomQuery?: boolean;
}

interface SemanticQueryConfig {
  indexes?: string[];
  limit?: number;
}

interface MSSearchItem {
  query: unknown;
  data: (result: QueryResult) => QueryHit[];
  facetData: (result: QueryResult) => TermFacetResult[];
  total: (result: QueryResult) => number;
  id: string;
}

interface ErrorResult {
  error: boolean;
  message: string;
}

interface QueryResponse {
  status: number;
  took: number;
  error?: string;
  hits?: {
    hits: QueryHit[];
    total: number;
  };
  facets?: Record<string, { terms: TermFacetResult[] }>;
}

interface MultiqueryResult {
  responses: QueryResponse[];
}

// Type guard function to check if configuration is a SearchWidgetConfig
function isSearchWidgetConfig(config: unknown): config is SearchWidgetConfig {
  return (
    config !== null &&
    typeof config === 'object' &&
    typeof (config as SearchWidgetConfig).itemsPerPage === 'number' &&
    typeof (config as SearchWidgetConfig).page === 'number'
  );
}

export default function Listener({ children, onChange }: ListenerProps) {
  const [{ url, listenerEffect, widgets, headers }, dispatch] = useSharedContext();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // We need to prepare some data in each render.
  // This needs to be done out of the effect function.
  function widgetThat(key: keyof Widget): Map<string, Widget> {
    return new Map([...widgets].filter(([, v]) => v[key]));
  }

  function mapFrom(key: keyof Widget): Map<string, unknown> {
    return new Map([...widgets].filter(([, v]) => v[key]).map(([k, v]) => [k, v[key]]));
  }

  const configurableWidgets = widgetThat("needsConfiguration");
  const facetWidgets = widgetThat("isFacet");
  const searchWidgets = widgetThat("needsQuery");
  const resultWidgets = widgetThat("wantResults");
  const queries = new Map([...widgets].filter(([, v]) => v.query).map(([k, v]) => [k, v.query]));
  const semanticQueries = new Map(
    [...widgets]
      .filter(([, v]) => v.semanticQuery && v.isSemantic)
      .map(([k, v]) => [
        k,
        {
          query: v.semanticQuery || "",
          indexes: (v.configuration as SemanticQueryConfig)?.indexes,
          limit: (v.configuration as SemanticQueryConfig)?.limit,
        },
      ]),
  );
  const configurations = mapFrom("configuration");
  const values = mapFrom("value");

  // Create stable keys for dependency comparison
  const queriesKey = JSON.stringify(Array.from(queries.entries()).sort());
  const semanticQueriesKey = JSON.stringify(Array.from(semanticQueries.entries()).sort());
  const configurationsKey = JSON.stringify(Array.from(configurations.entries()).sort());

  useEffect(() => {
    // Apply custom callback effect on every change, useful for query params.
    if (onChange) {
      // Add pages to params.
      const pages = [...configurations]
        .filter(([, v]) => (v as SearchWidgetConfig)?.page && (v as SearchWidgetConfig).page > 1)
        .map(([k, v]) => [`${k}Page`, (v as SearchWidgetConfig).page]);
      // Run the change callback with all params.
      onChange(new Map([...pages, ...values] as Array<[string, unknown]>));
    }
    // Run the deferred (thx algolia) listener effect.
    if (listenerEffect) {
      listenerEffect();
    }
  });

  // Run effect on update for each change in queries or configuration.
  useEffect(() => {
    // Clear any existing timeout to debounce multiple rapid updates
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // If you are debugging and your debug path leads you here, you might
    // check configurableWidgets and searchWidgets actually covers
    // the whole list of components that are configurables and queryable.
    const queriesReady = queries.size + semanticQueries.size === searchWidgets.size;
    const configurationsReady = configurations.size === configurableWidgets.size;
    const isAtLeastOneWidgetReady = searchWidgets.size + configurableWidgets.size > 0;

    if (queriesReady && configurationsReady && isAtLeastOneWidgetReady) {
      // Debounce to batch multiple widget updates into a single network call
      debounceTimeoutRef.current = setTimeout(() => {
        // The actual query to Antfly is deffered, to wait for all effects
        // and context operations before running.
        defer(() => {
          dispatch({
            type: "setListenerEffect",
            value: () => {
              const multiqueryData: MSSearchItem[] = [];
              resultWidgets.forEach((r, id) => {
                const config = r.configuration;
                // Type guard to ensure configuration has required SearchWidgetConfig properties
                if (!isSearchWidgetConfig(config)) {
                  return; // Skip widgets without proper configuration
                }
                const { itemsPerPage, page, sort } = config;
                // Join semanticQueries as a string
                const semanticQuery = Array.from(semanticQueries.values())
                  .map((v) => v.query)
                  .join(" ");
                // Get the first indexes configured for the widget
                const indexes = Array.from(semanticQueries.values())
                  .map((v) => v.indexes)
                  .filter((i) => i && Array.isArray(i) && i.length > 0)[0];

                // If this widget is a root query, filter out other root queries
                const filteredQueries = r.rootQuery
                  ? new Map(
                      [...queries].filter(([queryId]) => {
                        const w = widgets.get(queryId);
                        // Always include this widget's own query
                        if (queryId === id) return true;
                        // Include non-root queries (facets), but exclude autosuggest widgets
                        return !w?.rootQuery && !w?.isAutosuggest;
                      }),
                    )
                  : new Map(
                      [...queries].filter(([queryId]) => {
                        const w = widgets.get(queryId);
                        // For non-root query widgets, exclude only autosuggest widgets
                        return !w?.isAutosuggest;
                      }),
                    );

                // If there is no indexes, use the default one.
                multiqueryData.push({
                  query: {
                    semantic_search: semanticQuery,
                    indexes: semanticQuery ? indexes : undefined,
                    full_text_search: conjunctsFrom(filteredQueries),
                    limit: itemsPerPage,
                    offset: (page - 1) * itemsPerPage,
                    order_by: sort,
                    ...(config.fields && { _source: config.fields }),
                  },
                  data: (result: QueryResult) => result.hits?.hits || [],
                  facetData: () => [],
                  total: (result: QueryResult) => result.hits?.total || 0,
                  id,
                });
              });

              // Fetch data for internal facet components.
              facetWidgets.forEach((f, id) => {
                const config = f.configuration as FacetWidgetConfig;
                const fields = config.fields;
                const size = config.size;
                const filterValue = config.filterValue;
                const useCustomQuery = config.useCustomQuery;

                // Get the aggs (antfly queries) from fields
                // Dirtiest part, because we build a raw query from various params
                function aggsFromFields() {
                  // Remove current query from queries list (do not react to self)
                  function withoutOwnQueries() {
                    const q = new Map(queries);
                    q.delete(id);
                    return q;
                  }
                  // Transform a single field to agg query
                  function aggFromField(field: string) {
                    const t = { field, size };
                    return { [field]: t };
                  }
                  // Actually build the query from fields
                  let result = {};
                  fields.forEach((f: string) => {
                    result = { ...result, ...aggFromField(f) };
                  });
                  // Join semanticQueries as a string
                  const semanticQuery = Array.from(semanticQueries.values())
                    .map((v) => v.query)
                    .join(" ");
                  // Get the first indexes configured for the widget
                  const indexes = Array.from(semanticQueries.values())
                    .map((v) => v.indexes)
                    .filter((i) => i && Array.isArray(i) && i.length > 0)[0];
                  const limit = Array.from(semanticQueries.values()).map((v) => v.limit)[0] || 10;

                  // Build query with custom query support
                  const baseQueries = withoutOwnQueries();

                  // For custom queries, only include queries from other facets (exclude searchbox)
                  const facetOnlyQueries = new Map(
                    [...baseQueries].filter(([queryId]) => {
                      const w = widgets.get(queryId);
                      return w?.isFacet === true; // Only include facet filters
                    }),
                  );

                  const fullTextQuery =
                    useCustomQuery && f.query
                      ? conjunctsFrom(new Map([...facetOnlyQueries, [id, f.query]]))
                      : conjunctsFrom(baseQueries);

                  return {
                    semantic_search: semanticQuery,
                    indexes: semanticQuery ? indexes : undefined,
                    limit: semanticQuery ? limit : 0,
                    full_text_search: fullTextQuery,
                    facets: result,
                  };
                }
                multiqueryData.push({
                  query: aggsFromFields(),
                  data: () => [],
                  facetData: (result: QueryResult) => {
                    // Merge aggs (if there is more than one for a facet),
                    // then remove duplicate and add count (sum),
                    // then sort and slice to get only 10 first.
                    const map = new Map();
                    // Safety check: ensure fields is an array before calling .map()
                    if (!fields || !Array.isArray(fields)) {
                      return [];
                    }
                    fields
                      .map((f: string) => {
                        if (!result.facets || !result.facets[f] || !result.facets[f].terms) {
                          return [];
                        }
                        // Only use filterValue for legacy mode (non-custom queries)
                        if (filterValue && !useCustomQuery) {
                          return result.facets[f].terms.filter((i: TermFacetResult) =>
                            i.term.toLowerCase().includes(filterValue.toLowerCase()),
                          );
                        }
                        return result.facets[f].terms;
                      })
                      .reduce((a: TermFacetResult[], b: TermFacetResult[]) => a.concat(b), [])
                      .forEach((i: TermFacetResult) => {
                        map.set(i.term, {
                          term: i.term,
                          count: map.has(i.term) ? i.count + map.get(i.term).count : i.count,
                        });
                      });
                    return [...map.values()]
                      .sort((x: TermFacetResult, y: TermFacetResult) => y.count - x.count)
                      .slice(0, size);
                  },
                  total: (result: QueryResult) => result.hits?.total || 0,
                  id: id,
                });
              });

              // Fetch the data.
              async function fetchData() {
                // Only if there is a query to run.
                if (multiqueryData.length) {
                  try {
                    const msearchRequests: MultiqueryRequest[] = multiqueryData.map((item) => ({
                      query: item.query as Record<string, unknown>,
                    }));
                    const result = await multiquery(url || "", msearchRequests, headers || {});

                    // Handle connection error from multiquery
                    if (result && typeof result === "object" && "error" in result && result.error) {
                      console.error("Antfly connection error:", (result as ErrorResult).message);
                      // Set error state for all widgets
                      multiqueryData.forEach(({ id }) => {
                        const widget = widgets.get(id);
                        if (widget) {
                          widget.result = {
                            data: [],
                            facetData: [],
                            total: 0,
                            error: (result as ErrorResult).message,
                          };
                          dispatch({ type: "setWidget", key: id, ...widget });
                        }
                      });
                      return;
                    }

                    const responses = (result as MultiqueryResult)?.responses;
                    if (responses) {
                      responses.forEach((response: QueryResponse, key: number) => {
                        const widget = widgets.get(multiqueryData[key].id);
                        if (widget) {
                          if (response.status !== 200) {
                            console.error("Antfly response error:", response.error);
                            widget.result = {
                              data: [],
                              facetData: [],
                              total: 0,
                              error: response.error || "Query failed",
                            };
                          } else {
                            widget.result = {
                              data: multiqueryData[key].data(response),
                              facetData: multiqueryData[key].facetData(response),
                              total: multiqueryData[key].total(response),
                            };
                          }
                          // Update widget
                          dispatch({ type: "setWidget", key: multiqueryData[key].id, ...widget });
                        }
                      });
                    }
                  } catch (error) {
                    console.error("Unexpected error during Antfly query:", error);
                    // Set error state for all widgets
                    multiqueryData.forEach(({ id }) => {
                      const widget = widgets.get(id);
                      if (widget) {
                        widget.result = {
                          data: [],
                          facetData: [],
                          total: 0,
                          error: "Unexpected error occurred",
                        };
                        dispatch({ type: "setWidget", key: id, ...widget });
                      }
                    });
                  }
                }
              }
              fetchData();
              // Destroy the effect listener to avoid infinite loop!
              dispatch({ type: "setListenerEffect", value: null });
            },
          });
        });
      }, 15); // 15ms debounce delay to batch rapid updates
    }

    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    queriesKey,
    semanticQueriesKey,
    configurationsKey,
    dispatch,
    url,
    headers,
    searchWidgets.size,
    configurableWidgets.size,
    // listenerEffect removed to prevent infinite loop
    // Note: We intentionally use stable keys instead of the Map objects themselves
    // to avoid constant re-renders while still tracking changes
  ]);

  return <>{children}</>;
}
