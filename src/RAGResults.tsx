/* eslint-disable react-refresh/only-export-components */
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  createContext,
  useContext,
  useMemo,
} from "react";
import { useSharedContext } from "./SharedContext";
import { streamRAG, resolveTable } from "./utils";
import { GeneratorConfig, RAGRequest, QueryHit, RAGResult } from "@antfly/sdk";

// Context for sharing RAG data with child components (e.g., AnswerFeedback)
export interface RAGResultsContextValue {
  query: string;
  result: RAGResult | null;
  isStreaming: boolean;
}

export const RAGResultsContext = createContext<RAGResultsContextValue | null>(null);

export function useRAGResultsContext() {
  const context = useContext(RAGResultsContext);
  if (!context) {
    throw new Error("useRAGResultsContext must be used within a RAGResults component");
  }
  return context;
}

export interface RAGResultsProps {
  id: string;
  answerBoxId: string;
  summarizer: GeneratorConfig;
  systemPrompt?: string;
  table?: string; // Optional table override - auto-inherits from AnswerBox if not specified
  filterQuery?: Record<string, unknown>; // Filter query to constrain RAG retrieval
  exclusionQuery?: Record<string, unknown>; // Exclusion query to exclude matches
  /**
   * Custom render function for the summary text. Allows developers to bring their own
   * markdown renderer (e.g., streamdown.ai, react-markdown, marked) and citation interaction.
   *
   * @param summary - The RAG summary text (may contain inline citations like [doc_id doc1])
   * @param isStreaming - Whether the summary is currently streaming
   * @param hits - Optional search result hits if showHits is enabled
   * @returns Rendered summary component
   *
   * @example With streamdown.ai
   * ```tsx
   * <RAGResults
   *   renderSummary={(summary) => <StreamdownMarkdown>{summary}</StreamdownMarkdown>}
   * />
   * ```
   *
   * @example With custom parser
   * ```tsx
   * <RAGResults
   *   renderSummary={(summary, streaming) => (
   *     <CustomMarkdown text={summary} streaming={streaming} />
   *   )}
   * />
   * ```
   */
  renderSummary?: (summary: string, isStreaming: boolean, hits?: QueryHit[]) => ReactNode;
  /**
   * @deprecated Citations are now inline in the summary text using [doc_id ...] format.
   * Use renderSummary prop to customize how inline citations are displayed.
   */
  showCitations?: boolean;
  /**
   * @deprecated with_citations is no longer supported by the backend.
   * Citations are always included inline in the markdown summary.
   */
  withCitations?: boolean;
  showHits?: boolean;
  fields?: string[];
  children?: ReactNode;
}

export default function RAGResults({
  id,
  answerBoxId,
  summarizer,
  systemPrompt,
  table,
  filterQuery,
  exclusionQuery,
  renderSummary,
  showHits = false,
  fields,
  children,
}: RAGResultsProps) {
  const [{ widgets, url, table: defaultTable, headers }, dispatch] = useSharedContext();
  const [summary, setSummary] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<QueryHit[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousSubmissionRef = useRef<number | undefined>(undefined);

  // Watch for changes in the AnswerBox widget
  const answerBoxWidget = widgets.get(answerBoxId);
  const currentQuery = answerBoxWidget?.value as string | undefined;
  const submittedAt = answerBoxWidget?.submittedAt;

  // Trigger RAG request when AnswerBox is submitted (based on timestamp, not just query value)
  useEffect(() => {
    // Only trigger if we have a query and a submission timestamp
    if (!currentQuery || !submittedAt) {
      return;
    }

    // Check if this is a new submission (different timestamp from previous)
    if (submittedAt === previousSubmissionRef.current) {
      return;
    }

    // Validation check - don't proceed if URL is missing
    if (!url) {
      console.error("RAGResults: Missing API URL in context");
      return;
    }

    // Cancel any previous stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    previousSubmissionRef.current = submittedAt;

    // Get the query from the AnswerBox widget
    const answerBoxQuery = answerBoxWidget?.query;
    const answerBoxSemanticQuery = answerBoxWidget?.semanticQuery;
    const answerBoxConfiguration = answerBoxWidget?.configuration;

    // Resolve table: prop > AnswerBox widget > default
    const widgetTable = table || answerBoxWidget?.table;
    const resolvedTable = resolveTable(widgetTable, defaultTable);

    // Build the RAG request (table will be added by streamRAG)
    const ragRequest: RAGRequest = {
      queries: [
        {
          full_text_search: answerBoxQuery as Record<string, unknown> | undefined,
          semantic_search: answerBoxSemanticQuery,
          indexes: answerBoxConfiguration?.indexes as string[] | undefined,
          limit: (answerBoxConfiguration?.limit as number | undefined) || 10,
          fields: fields || [],
          filter_query: filterQuery,
          exclusion_query: exclusionQuery,
        },
      ],
      summarizer,
      system_prompt: systemPrompt,
      // Note: with_citations is deprecated - citations are now inline in markdown summary
    };

    // Start streaming
    const startStream = async () => {
      // Reset state at the start of the async operation
      setSummary("");
      setError(null);
      setIsStreaming(true);
      setHits([]);

      try {
        const controller = await streamRAG(url, resolvedTable, ragRequest, headers || {}, {
          onHit: (hit) => {
            setHits((prev) => [...prev, hit]);
          },
          onSummary: (chunk) => {
            setSummary((prev) => prev + chunk);
          },
          onComplete: () => {
            setIsStreaming(false);
          },
          onError: (err) => {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            setIsStreaming(false);
          },
          onRAGResult: (result) => {
            // Non-streaming response
            setSummary(result.summary_result?.summary || "");
            setHits(result.query_results?.[0]?.hits?.hits || []);
            setIsStreaming(false);
          },
        });

        abortControllerRef.current = controller;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsStreaming(false);
      }
    };

    startStream();

    // Cleanup on unmount or when submission changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    submittedAt,
    currentQuery,
    answerBoxWidget,
    url,
    table,
    defaultTable,
    headers,
    summarizer,
    systemPrompt,
    fields,
    filterQuery,
    exclusionQuery,
  ]);

  // Register this component as a widget (for consistency with other components)
  useEffect(() => {
    dispatch({
      type: "setWidget",
      key: id,
      needsQuery: false,
      needsConfiguration: false,
      isFacet: false,
      wantResults: false,
      table: table,
      value: summary,
    });
  }, [dispatch, id, table, summary]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      dispatch({ type: "deleteWidget", key: id });
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    },
    [dispatch, id],
  );

  // Default render function - plain text with inline citations
  const defaultRender = useCallback(
    (summaryText: string, streaming: boolean, hitList?: QueryHit[]) => (
      <div className="react-af-rag-results">
        {error && (
          <div className="react-af-rag-error" style={{ color: "red" }}>
            Error: {error}
          </div>
        )}
        {!error && !summaryText && !streaming && (
          <div className="react-af-rag-empty">
            No results yet. Submit a question to get started.
          </div>
        )}
        {summaryText && (
          <div className="react-af-rag-summary">
            {summaryText}
            {streaming && <span className="react-af-rag-streaming"> ...</span>}
          </div>
        )}
        {showHits && hitList && hitList.length > 0 && (
          <details className="react-af-rag-hits">
            <summary>Search Results ({hitList.length})</summary>
            <ul>
              {hitList.map((hit, idx) => (
                <li key={hit._id || idx}>
                  <strong>Score:</strong> {hit._score.toFixed(3)}
                  <pre>{JSON.stringify(hit._source, null, 2)}</pre>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    ),
    [error, showHits],
  );

  // Build context value for child components (e.g., AnswerFeedback)
  const contextValue = useMemo<RAGResultsContextValue>(() => {
    const result: RAGResult | null = summary
      ? ({
          summary_result: { summary },
          query_results: [
            {
              hits: {
                hits,
                total: { value: hits.length, relation: "eq" },
              },
              took: 0,
              status: 200,
            },
          ],
        } as unknown as RAGResult)
      : null;

    return {
      query: currentQuery || "",
      result,
      isStreaming,
    };
  }, [currentQuery, summary, hits, isStreaming]);

  return (
    <RAGResultsContext.Provider value={contextValue}>
      {renderSummary
        ? renderSummary(summary, isStreaming, hits)
        : defaultRender(summary, isStreaming, hits)}
      {children}
    </RAGResultsContext.Provider>
  );
}
