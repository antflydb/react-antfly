import React, { useEffect, ReactNode } from "react";
import { useSharedContext, SharedState, Widget } from "./SharedContextProvider";
import { msearch, queryFrom, defer, MultiqueryRequest } from "./utils";

interface ListenerProps {
  children: ReactNode;
  onChange?: (params: Map<string, unknown>) => void;
}

interface MSSearchItem {
  query: unknown;
  data: (result: any) => unknown[];
  total: (result: any) => number;
  id: string;
}

export default function Listener({ children, onChange }: ListenerProps) {
  const [{ url, listenerEffect, widgets, headers }, dispatch] = useSharedContext();

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
          query: v.semanticQuery || '',
          indexes: (v.configuration as any)?.indexes,
          limit: (v.configuration as any)?.limit,
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
        .filter(([, v]) => (v as any)?.page && (v as any).page > 1)
        .map(([k, v]) => [`${k}Page`, (v as any).page]);
      // Run the change callback with all params.
      onChange(new Map([...pages, ...values] as Array<[string, unknown]>));
    }
    // Run the deferred (thx algolia) listener effect.
    listenerEffect && listenerEffect();
  });

  // Run effect on update for each change in queries or configuration.
  useEffect(() => {
    // If you are debugging and your debug path leads you here, you might
    // check configurableWidgets and searchWidgets actually covers
    // the whole list of components that are configurables and queryable.
    const queriesReady = queries.size + semanticQueries.size === searchWidgets.size;
    const configurationsReady = configurations.size === configurableWidgets.size;
    const isAtLeastOneWidgetReady = searchWidgets.size + configurableWidgets.size > 0;

    if (queriesReady && configurationsReady && isAtLeastOneWidgetReady) {
      // The actual query to Antfly is deffered, to wait for all effects
      // and context operations before running.
      defer(() => {
        dispatch({
          type: "setListenerEffect",
          value: () => {
            const msearchData: MSSearchItem[] = [];
            resultWidgets.forEach((r, id) => {
              const config = r.configuration as any;
              const { itemsPerPage, page, sort } = config;
              // Join semanticQueries as a string
              const semanticQuery = Array.from(semanticQueries.values()).map((v) => v.query).join(" ");
              // Get the first indexes configured for the widget
              const indexes = Array.from(semanticQueries.values()).map((v) => v.indexes).filter(
                (i) => i && Array.isArray(i) && i.length > 0,
              )[0];
              // If there is no indexes, use the default one.
              msearchData.push({
                query: {
                  semantic_search: semanticQuery,
                  indexes: semanticQuery ? indexes : undefined,
                  full_text_search: queryFrom(queries),
                  limit: itemsPerPage,
                  offset: (page - 1) * itemsPerPage,
                  order_by: sort,
                },
                data: (result: any) => result.hits.hits,
                total: (result: any) => result.hits.total,
                id,
              });
            });

            // Fetch data for internal facet components.
            facetWidgets.forEach((f, id) => {
              const config = f.configuration as any;
              const fields = config.fields;
              const size = config.size;
              const filterValue = config.filterValue;

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
                  if (field?.endsWith?.(".keyword")) {
                    field = field.replace(/\.keyword$/, "");
                  }
                  const t = { field, size };
                  return { [field]: t };
                }
                // Actually build the query from fields
                let result = {};
                fields.forEach((f: string) => {
                  result = { ...result, ...aggFromField(f) };
                });
                // Join semanticQueries as a string
                const semanticQuery = Array.from(semanticQueries.values()).map((v) => v.query).join(" ");
                // Get the first indexes configured for the widget
                const indexes = Array.from(semanticQueries.values()).map((v) => v.indexes).filter(
                  (i) => i && Array.isArray(i) && i.length > 0,
                )[0];
                const limit = Array.from(semanticQueries.values()).map((v) => v.limit)[0] || 10;
                return {
                  semantic_search: semanticQuery,
                  indexes: semanticQuery ? indexes : undefined,
                  limit: semanticQuery ? limit : 0,
                  full_text_search: queryFrom(withoutOwnQueries()),
                  facets: result,
                };
              }
              msearchData.push({
                query: aggsFromFields(),
                data: (result: any) => {
                  // Merge aggs (if there is more than one for a facet),
                  // then remove duplicate and add doc_count (sum),
                  // then sort and slice to get only 10 first.
                  const map = new Map();
                  fields
                    .map((f: string) => {
                      if (f?.endsWith?.(".keyword")) {
                        f = f.replace(/\.keyword$/, "");
                      }
                      if (!result.facets || !result.facets[f] || !result.facets[f].terms) {
                        return [];
                      }
                      // If the terms doesn't match the filterValue
                      // then skip it as well
                      if (filterValue) {
                        return result.facets[f].terms.filter((i: any) =>
                          i.term.toLowerCase().includes(filterValue.toLowerCase()),
                        );
                      }
                      return result.facets[f].terms;
                    })
                    .reduce((a: any[], b: any[]) => a.concat(b))
                    .forEach((i: any) => {
                      map.set(i.term, {
                        key: i.term,
                        doc_count: map.has(i.term) ? i.count + map.get(i.term).doc_count : i.count,
                      });
                    });
                  return [...map.values()].sort((x: any, y: any) => y.doc_count - x.doc_count).slice(0, size);
                },
                total: (result: any) => result.hits.total,
                id: id,
              });
            });

            // Fetch the data.
            async function fetchData() {
              // Only if there is a query to run.
              if (msearchData.length) {
                try {
                  const msearchRequests: MultiqueryRequest[] = msearchData.map((item) => ({
                    query: item.query as any,
                  }));
                  const result = await msearch(url || '', msearchRequests, headers || {});

                  // Handle connection error from msearch
                  if (result && typeof result === 'object' && 'error' in result && result.error) {
                    console.error("Antfly connection error:", (result as any).message);
                    // Set error state for all widgets
                    msearchData.forEach(({ id }) => {
                      const widget = widgets.get(id);
                      if (widget) {
                        widget.result = {
                          data: [],
                          total: 0,
                          error: (result as any).message,
                        };
                        dispatch({ type: "setWidget", key: id, ...widget });
                      }
                    });
                    return;
                  }

                  const responses = (result as any)?.responses;
                  if (responses) {
                    responses.forEach((response: any, key: number) => {
                      const widget = widgets.get(msearchData[key].id);
                      if (widget) {
                        if (response.status !== 200) {
                          console.error("Antfly response error:", response.error);
                          widget.result = {
                            data: [],
                            total: 0,
                            error: response.error?.reason || "Query failed",
                          };
                        } else {
                          widget.result = {
                            data: msearchData[key].data(response),
                            total: msearchData[key].total(response),
                          };
                        }
                        // Update widget
                        dispatch({ type: "setWidget", key: msearchData[key].id, ...widget });
                      }
                    });
                  }
                } catch (error) {
                  console.error("Unexpected error during Antfly query:", error);
                  // Set error state for all widgets
                  msearchData.forEach(({ id }) => {
                    const widget = widgets.get(id);
                    if (widget) {
                      widget.result = {
                        data: [],
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
    }
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
  ]);

  return <>{children}</>;
}