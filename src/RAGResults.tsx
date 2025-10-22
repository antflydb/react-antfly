import React, { useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useSharedContext } from "./SharedContext";
import { streamRAG } from "./utils";
import { ModelConfig, RAGRequest, RAGResult, Citation } from "@antfly/sdk";

export interface RAGResultsProps {
  id: string;
  answerBoxId: string;
  summarizer: ModelConfig;
  systemPrompt?: string;
  renderSummary?: (summary: string, isStreaming: boolean, citations?: Citation[]) => ReactNode;
  showCitations?: boolean;
  withCitations?: boolean;
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
  fields,
}: RAGResultsProps) {
  const [{ widgets, url, headers }, dispatch] = useSharedContext();
  const [summary, setSummary] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousQueryRef = useRef<string>("");

  // Watch for changes in the AnswerBox widget
  const answerBoxWidget = widgets.get(answerBoxId);
  const currentQuery = answerBoxWidget?.value as string | undefined;

  // Trigger RAG request when AnswerBox value changes
  useEffect(() => {
    // Only trigger if we have a query and it's different from the previous one
    if (!currentQuery || currentQuery === previousQueryRef.current) {
      return;
    }

    // Validation check - don't proceed if URL is missing
    if (!url) {
      return;
    }

    // Cancel any previous stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    previousQueryRef.current = currentQuery;

    // Get the query from the AnswerBox widget
    const answerBoxQuery = answerBoxWidget?.query;
    const answerBoxSemanticQuery = answerBoxWidget?.semanticQuery;
    const answerBoxConfiguration = answerBoxWidget?.configuration;

    // Build the RAG request
    const ragRequest: RAGRequest = {
      query: {
        full_text_search: answerBoxQuery as Record<string, unknown> | undefined,
        semantic_search: answerBoxSemanticQuery,
        indexes: answerBoxConfiguration?.indexes as string[] | undefined,
        limit: (answerBoxConfiguration?.limit as number | undefined) || 10,
        fields: fields || [],
      },
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

      try {
        const controller = await streamRAG(
          url,
          ragRequest,
          headers || {},
          // onChunk
          (chunk: string) => {
            setSummary((prev) => prev + chunk);
          },
          // onComplete
          () => {
            setIsStreaming(false);
          },
          // onError
          (err: Error) => {
            setError(err.message);
            setIsStreaming(false);
          },
          // onRAGResult
          (result: RAGResult) => {
            setSummary(result.summary_result?.summary || "");
            setCitations(result.summary_result?.citations || []);
            setIsStreaming(false);
          },
        );

        abortControllerRef.current = controller;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsStreaming(false);
      }
    };

    startStream();

    // Cleanup on unmount or when query changes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [currentQuery, answerBoxWidget, url, headers, summarizer, systemPrompt, withCitations, fields]);

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
    (summaryText: string, streaming: boolean, citationList?: Citation[]) => (
      <div className="react-af-rag-results">
        {error && (
          <div className="react-af-rag-error" style={{ color: "red" }}>
            Error: {error}
          </div>
        )}
        {!error && !summaryText && !streaming && (
          <div className="react-af-rag-empty">No results yet. Submit a question to get started.</div>
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
                <li key={citation.document_id || idx}>
                  <strong>Document:</strong> {citation.document_id}
                  {citation.score && <span> (score: {citation.score.toFixed(2)})</span>}
                  <div className="react-af-rag-citation-content">{citation.content}</div>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    ),
    [error, showCitations],
  );

  return <>{renderSummary ? renderSummary(summary, isStreaming, citations) : defaultRender(summary, isStreaming, citations)}</>;
}
