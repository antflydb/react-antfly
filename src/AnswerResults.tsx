import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import { useSharedContext } from "./SharedContext";
import { streamAnswer, resolveTable } from "./utils";
import { GeneratorConfig, AnswerAgentRequest, QueryHit, AnswerAgentResult } from "@antfly/sdk";
import { AnswerResultsContext, AnswerResultsContextValue } from "./AnswerResultsContext";

export interface AnswerResultsProps {
  id: string;
  answerBoxId: string;
  generator: GeneratorConfig;
  systemPrompt?: string;
  table?: string; // Optional table override - auto-inherits from AnswerBox if not specified
  filterQuery?: Record<string, unknown>; // Filter query to constrain search results
  exclusionQuery?: Record<string, unknown>; // Exclusion query to exclude matches

  // Visibility controls
  showClassification?: boolean;
  showReasoning?: boolean;
  showFollowUpQuestions?: boolean;
  showHits?: boolean;

  // Custom renderers
  renderLoading?: () => ReactNode;
  renderClassification?: (data: {
    route_type: "question" | "search";
    improved_query: string;
    semantic_query: string;
    confidence: number;
  }) => ReactNode;
  renderReasoning?: (reasoning: string, isStreaming: boolean) => ReactNode;
  renderAnswer?: (answer: string, isStreaming: boolean, hits?: QueryHit[]) => ReactNode;
  renderFollowUpQuestions?: (questions: string[]) => ReactNode;
  renderHits?: (hits: QueryHit[]) => ReactNode;

  // Callbacks
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: string) => void;

  children?: ReactNode;
}

export default function AnswerResults({
  id,
  answerBoxId,
  generator,
  systemPrompt,
  table,
  filterQuery,
  exclusionQuery,
  showClassification = false,
  showReasoning = false,
  showFollowUpQuestions = true,
  showHits = false,
  renderLoading,
  renderClassification,
  renderReasoning,
  renderAnswer,
  renderFollowUpQuestions,
  renderHits,
  onStreamStart,
  onStreamEnd,
  onError: onErrorCallback,
  children,
}: AnswerResultsProps) {
  const [{ widgets, url, table: defaultTable, headers }, dispatch] = useSharedContext();

  // Answer agent state
  const [classification, setClassification] = useState<{
    route_type: "question" | "search";
    improved_query: string;
    semantic_query: string;
    confidence: number;
  } | null>(null);
  const [hits, setHits] = useState<QueryHit[]>([]);
  const [reasoning, setReasoning] = useState("");
  const [answer, setAnswer] = useState("");
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const previousSubmissionRef = useRef<number | undefined>(undefined);

  // Watch for changes in the AnswerBox widget
  const answerBoxWidget = widgets.get(answerBoxId);
  const currentQuery = answerBoxWidget?.value as string | undefined;
  const submittedAt = answerBoxWidget?.submittedAt;

  // Trigger Answer Agent request when AnswerBox is submitted (based on timestamp, not just query value)
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
      console.error("AnswerResults: Missing API URL in context");
      return;
    }

    // Cancel any previous stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    previousSubmissionRef.current = submittedAt;

    // Get the query configuration from the AnswerBox widget
    const answerBoxQuery = answerBoxWidget?.query;
    const answerBoxSemanticQuery = answerBoxWidget?.semanticQuery;
    const answerBoxConfiguration = answerBoxWidget?.configuration;

    // Resolve table: prop > AnswerBox widget > default
    const widgetTable = table || answerBoxWidget?.table;
    const resolvedTable = resolveTable(widgetTable, defaultTable);

    // Build the Answer Agent request with queries array (similar to RAG format)
    const answerRequest: AnswerAgentRequest = {
      query: currentQuery,
      queries: [
        {
          table: resolvedTable,
          full_text_search: answerBoxQuery as Record<string, unknown> | undefined,
          semantic_search: answerBoxSemanticQuery,
          indexes: answerBoxConfiguration?.indexes as string[] | undefined,
          limit: (answerBoxConfiguration?.limit as number | undefined) || 10,
          filter_query: filterQuery,
          exclusion_query: exclusionQuery,
        },
      ],
      summarizer: generator,
      system_prompt: systemPrompt,
      with_streaming: true,
      with_reasoning: showReasoning || false,
      with_followup: showFollowUpQuestions || false,
    };

    // Start streaming
    const startStream = async () => {
      // Reset state at the start of the async operation
      setClassification(null);
      setHits([]);
      setReasoning("");
      setAnswer("");
      setFollowUpQuestions([]);
      setError(null);
      setIsStreaming(true);

      if (onStreamStart) {
        onStreamStart();
      }

      try {
        const controller = await streamAnswer(url, answerRequest, headers || {}, {
          onClassification: (data) => {
            setClassification(data);
          },
          onHit: (hit) => {
            setHits((prev) => [...prev, hit]);
          },
          onReasoning: (chunk) => {
            setReasoning((prev) => prev + chunk);
          },
          onAnswer: (chunk) => {
            setAnswer((prev) => prev + chunk);
          },
          onFollowUpQuestion: (question) => {
            setFollowUpQuestions((prev) => [...prev, question]);
          },
          onComplete: () => {
            setIsStreaming(false);
            if (onStreamEnd) {
              onStreamEnd();
            }
          },
          onError: (err) => {
            const message = err instanceof Error ? err.message : String(err);
            setError(message);
            setIsStreaming(false);
            if (onErrorCallback) {
              onErrorCallback(message);
            }
          },
          onAnswerAgentResult: (result) => {
            // Non-streaming response
            setAnswer(result.answer || "");
            setReasoning(result.reasoning || "");
            setFollowUpQuestions(result.followup_questions || []);
            setHits(result.query_results?.[0]?.hits?.hits || []);
            setIsStreaming(false);
            if (onStreamEnd) {
              onStreamEnd();
            }
          },
        });

        abortControllerRef.current = controller;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setIsStreaming(false);
        if (onErrorCallback) {
          onErrorCallback(message);
        }
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
    generator,
    systemPrompt,
    filterQuery,
    exclusionQuery,
    showReasoning,
    showFollowUpQuestions,
    onStreamStart,
    onStreamEnd,
    onErrorCallback,
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
      value: answer,
    });
  }, [dispatch, id, table, answer]);

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

  // Default renderers
  const defaultRenderClassification = useCallback(
    (data: {
      route_type: "question" | "search";
      improved_query: string;
      semantic_query: string;
      confidence: number;
    }) => (
      <div className="react-af-answer-classification">
        <strong>Classification:</strong> {data.route_type} (confidence: {(data.confidence * 100).toFixed(1)}%)
        <div>
          <strong>Improved Query:</strong> {data.improved_query}
        </div>
        <div>
          <strong>Semantic Query:</strong> {data.semantic_query}
        </div>
      </div>
    ),
    [],
  );

  const defaultRenderReasoning = useCallback(
    (reasoningText: string, streaming: boolean) => (
      <div className="react-af-answer-reasoning">
        <strong>Reasoning:</strong>
        <p>
          {reasoningText}
          {streaming && <span className="react-af-answer-streaming"> ...</span>}
        </p>
      </div>
    ),
    [],
  );

  const defaultRenderAnswer = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (answerText: string, streaming: boolean, _hits?: QueryHit[]) => (
      <div className="react-af-answer-text">
        {answerText}
        {streaming && <span className="react-af-answer-streaming"> ...</span>}
      </div>
    ),
    [],
  );

  const defaultRenderFollowUpQuestions = useCallback(
    (questions: string[]) => (
      <div className="react-af-answer-follow-up">
        <strong>Follow-up Questions:</strong>
        <ul>
          {questions.map((q, idx) => (
            <li key={idx}>{q}</li>
          ))}
        </ul>
      </div>
    ),
    [],
  );

  const defaultRenderHits = useCallback(
    (hitList: QueryHit[]) => (
      <details className="react-af-answer-hits">
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
    ),
    [],
  );

  // Build context value for child components (e.g., AnswerFeedback)
  const contextValue = useMemo<AnswerResultsContextValue>(() => {
    const result: AnswerAgentResult | null = answer
      ? ({
          answer,
          reasoning,
          followup_questions: followUpQuestions,
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
        } as unknown as AnswerAgentResult)
      : null;

    return {
      query: currentQuery || "",
      classification,
      hits,
      reasoning,
      answer,
      followUpQuestions,
      isStreaming,
      result,
    };
  }, [
    currentQuery,
    classification,
    hits,
    reasoning,
    answer,
    followUpQuestions,
    isStreaming,
  ]);

  return (
    <AnswerResultsContext.Provider value={contextValue}>
      <div className="react-af-answer-results">
        {error && (
          <div className="react-af-answer-error" style={{ color: "red" }}>
            Error: {error}
          </div>
        )}
        {!error && !answer && isStreaming && (
          renderLoading ? renderLoading() : (
            <div className="react-af-answer-loading">
              Loading answer...
            </div>
          )
        )}
        {!error && !answer && !isStreaming && (
          <div className="react-af-answer-empty">
            No results yet. Submit a question to get started.
          </div>
        )}
        {showClassification && classification && (
          renderClassification ? renderClassification(classification) : defaultRenderClassification(classification)
        )}
        {showReasoning && reasoning && (
          renderReasoning ? renderReasoning(reasoning, isStreaming) : defaultRenderReasoning(reasoning, isStreaming)
        )}
        {answer && (renderAnswer ? renderAnswer(answer, isStreaming, hits) : defaultRenderAnswer(answer, isStreaming, hits))}
        {showFollowUpQuestions && followUpQuestions.length > 0 && !isStreaming && (
          renderFollowUpQuestions
            ? renderFollowUpQuestions(followUpQuestions)
            : defaultRenderFollowUpQuestions(followUpQuestions)
        )}
        {showHits && hits.length > 0 && (renderHits ? renderHits(hits) : defaultRenderHits(hits))}
      </div>
      {children}
    </AnswerResultsContext.Provider>
  );
}
