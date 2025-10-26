import React, { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useSharedContext } from "./SharedContext";
import { streamRAG } from "./utils";
import { ModelConfig, RAGRequest, Citation, QueryHit } from "@antfly/sdk";

export interface RAGResultsProps {
  id: string;
  answerBoxId: string;
  summarizer: ModelConfig;
  systemPrompt?: string;
  renderSummary?: (
    summary: string,
    isStreaming: boolean,
    citations?: Citation[],
    hits?: QueryHit[],
  ) => ReactNode;
  showCitations?: boolean;
  withCitations?: boolean;
  showHits?: boolean;
  fields?: string[];
}

export default function RAGResults({
  id,
  answerBoxId,
  summarizer,
  systemPrompt,
  renderSummary,
  showCitations = true,
  withCitations = false,
  showHits = false,
  fields,
}: RAGResultsProps) {
  const [{ widgets, url, headers }, dispatch] = useSharedContext();
  const [summary, setSummary] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
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

    // Build the RAG request
    const ragRequest: RAGRequest = {
      queries: [{
        full_text_search: answerBoxQuery as Record<string, unknown> | undefined,
        semantic_search: answerBoxSemanticQuery,
        indexes: answerBoxConfiguration?.indexes as string[] | undefined,
        limit: (answerBoxConfiguration?.limit as number | undefined) || 10,
        fields: fields || [],
      }],
      summarizer,
      system_prompt: systemPrompt,
      with_citations: withCitations,
    };

    // Start streaming
    const startStream = async () => {
      // Reset state at the start of the async operation
      setSummary("");
      setError(null);
      setIsStreaming(true);
      setCitations([]);
      setHits([]);

      try {
        const controller = await streamRAG(url, ragRequest, headers || {}, {
          onHit: (hit) => {
            setHits((prev) => [...prev, hit]);
          },
          onSummary: (chunk) => {
            setSummary((prev) => prev + chunk);
          },
          onCitation: (citation) => {
            setCitations((prev) => [...prev, citation]);
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
            setCitations(result.summary_result?.citations || []);
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
    headers,
    summarizer,
    systemPrompt,
    withCitations,
    fields,
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
      value: summary,
    });
  }, [dispatch, id, summary]);

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

  // Default render function
  const defaultRender = useCallback(
    (summaryText: string, streaming: boolean, citationList?: Citation[], hitList?: QueryHit[]) => (
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
        {showCitations && citationList && citationList.length > 0 && (
          <details className="react-af-rag-citations">
            <summary>Citations ({citationList.length})</summary>
            <ul>
              {citationList.map((citation, idx) => (
                <li key={citation.id || idx}>
                  <strong>Document:</strong> {citation.id}
                  <div className="react-af-rag-citation-content">{citation.quote}</div>
                </li>
              ))}
            </ul>
          </details>
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
    [error, showCitations, showHits],
  );

  return (
    <>
      {renderSummary
        ? renderSummary(summary, isStreaming, citations, hits)
        : defaultRender(summary, isStreaming, citations, hits)}
    </>
  );
}
