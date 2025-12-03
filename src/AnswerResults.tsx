import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from "react";
import { useSharedContext } from "./SharedContext";
import { streamAnswer, resolveTable, classifyAnswerError, AnswerErrorType } from "./utils";
import {
  GeneratorConfig,
  AnswerAgentRequest,
  QueryHit,
  AnswerAgentResult,
  ClassificationTransformationResult,
  AnswerConfidence,
} from "@antfly/sdk";
import { AnswerResultsContext, AnswerResultsContextValue } from "./AnswerResultsContext";

export interface AnswerResultsProps {
  id: string;
  searchBoxId: string; // Links to the QueryBox that provides the search value
  generator: GeneratorConfig;
  systemPrompt?: string;
  table?: string; // Optional table override - auto-inherits from QueryBox if not specified
  filterQuery?: Record<string, unknown>; // Filter query to constrain search results
  exclusionQuery?: Record<string, unknown>; // Exclusion query to exclude matches
  fields?: string[];
  semanticIndexes?: string[];

  // Visibility controls
  showClassification?: boolean;
  showReasoning?: boolean;
  showFollowUpQuestions?: boolean;
  showConfidence?: boolean;
  showHits?: boolean;

  // Fallback behavior when answer generation fails but hits are available
  /**
   * How to handle failures when search hits are available:
   * - 'show-error': Show error message, hide hits (default legacy behavior)
   * - 'show-hits': Show hits as primary content when answer fails
   * - 'auto': Automatically show hits with a subtle notice when answer fails
   */
  fallbackBehavior?: 'show-error' | 'show-hits' | 'auto';

  // Custom renderers
  renderLoading?: () => ReactNode;
  renderEmpty?: () => ReactNode;
  renderClassification?: (data: ClassificationTransformationResult) => ReactNode;
  renderReasoning?: (reasoning: string, isStreaming: boolean) => ReactNode;
  renderAnswer?: (answer: string, isStreaming: boolean, hits?: QueryHit[]) => ReactNode;
  renderConfidence?: (confidence: AnswerConfidence) => ReactNode;
  renderFollowUpQuestions?: (questions: string[]) => ReactNode;
  renderHits?: (hits: QueryHit[]) => ReactNode;
  /**
   * Custom renderer for fallback mode (when answer fails but hits are available)
   * @param hits - The search hits that were retrieved
   * @param errorType - The classified type of error that caused the fallback
   * @param errorMessage - The original error message
   */
  renderFallback?: (hits: QueryHit[], errorType: AnswerErrorType, errorMessage: string) => ReactNode;

  // Callbacks
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: string) => void;
  /**
   * Called when falling back to search-only mode due to answer generation failure
   * @param errorType - The classified type of error
   * @param hits - The search hits being displayed
   * @param errorMessage - The original error message
   */
  onFallback?: (errorType: AnswerErrorType, hits: QueryHit[], errorMessage: string) => void;

  children?: ReactNode;
}

export default function AnswerResults({
  id,
  searchBoxId,
  generator,
  systemPrompt,
  table,
  filterQuery,
  exclusionQuery,
  fields,
  semanticIndexes,
  showClassification = false,
  showReasoning = false,
  showFollowUpQuestions = true,
  showConfidence = false,
  showHits = false,
  fallbackBehavior = 'show-error',
  renderLoading,
  renderEmpty,
  renderClassification,
  renderReasoning,
  renderAnswer,
  renderConfidence,
  renderFollowUpQuestions,
  renderHits,
  renderFallback,
  onStreamStart,
  onStreamEnd,
  onError: onErrorCallback,
  onFallback,
  children,
}: AnswerResultsProps) {
  const [{ widgets, url, table: defaultTable, headers }, dispatch] = useSharedContext();

  // Answer agent state
  const [classification, setClassification] = useState<ClassificationTransformationResult | null>(null);
  const [hits, setHits] = useState<QueryHit[]>([]);
  const [reasoning, setReasoning] = useState("");
  const [answer, setAnswer] = useState("");
  const [confidence, setConfidence] = useState<AnswerConfidence | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track the last processed submission timestamp (also serves as hasSubmitted indicator)
  const [lastProcessedSubmission, setLastProcessedSubmission] = useState<number | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);
  const previousSubmissionRef = useRef<number | undefined>(undefined);

  // Watch for changes in the QueryBox widget
  const searchBoxWidget = widgets.get(searchBoxId);
  const currentQuery = searchBoxWidget?.value as string | undefined;
  const submittedAt = searchBoxWidget?.submittedAt;

  // Derive hasSubmitted from state (safe to use during render)
  const hasSubmitted = lastProcessedSubmission !== undefined;

  // Trigger Answer Agent request when QueryBox is submitted (based on timestamp, not just query value)
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

    // Resolve table: prop > QueryBox widget > default
    const widgetTable = table || searchBoxWidget?.table;
    const resolvedTable = resolveTable(widgetTable, defaultTable);

    // Build the Answer Agent request with queries array (similar to RAG format)
    // QueryBox only provides the text value, AnswerResults owns the query configuration
    const answerRequest: AnswerAgentRequest = {
      query: currentQuery,
      queries: [
        {
          table: resolvedTable,
          // Use the query value directly as semantic search
          semantic_search: currentQuery,
          fields: fields || [],
          indexes: semanticIndexes || [],
          filter_query: filterQuery,
          exclusion_query: exclusionQuery,
        },
      ],
      generator: generator,
      with_streaming: true,
    };

    // Start streaming
    const startStream = async () => {
      // Reset state at the start of the async operation
      setClassification(null);
      setHits([]);
      setReasoning("");
      setAnswer("");
      setLastProcessedSubmission(submittedAt); // Track that we've processed this submission
      setConfidence(null);
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
          onReasoning: (chunk) => {
            setReasoning((prev) => prev + chunk);
          },
          onHit: (hit) => {
            setHits((prev) => [...prev, hit]);
          },
          onAnswer: (chunk) => {
            setAnswer((prev) => prev + chunk);
          },
          onConfidence: (data) => {
            setConfidence(data);
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
            setClassification(result.classification_transformation || null);
            setAnswer(result.answer || "");
            setFollowUpQuestions(result.followup_questions || []);
            setHits(result.query_results?.[0]?.hits?.hits || []);
            if (result.answer_confidence !== undefined && result.context_relevance !== undefined) {
              setConfidence({
                answer_confidence: result.answer_confidence,
                context_relevance: result.context_relevance,
              });
            }
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
    searchBoxWidget,
    url,
    table,
    defaultTable,
    headers,
    generator,
    systemPrompt,
    fields,
    semanticIndexes,
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
    (data: ClassificationTransformationResult) => (
      <div className="react-af-answer-classification">
        <strong>Classification:</strong> {data.route_type} (confidence: {(data.confidence * 100).toFixed(1)}%)
        <div>
          <strong>Strategy:</strong> {data.strategy}, <strong>Semantic Mode:</strong> {data.semantic_mode}
        </div>
        <div>
          <strong>Improved Query:</strong> {data.improved_query}
        </div>
        <div>
          <strong>Semantic Query:</strong> {data.semantic_query}
        </div>
        {data.reasoning && (
          <div>
            <strong>Reasoning:</strong> {data.reasoning}
          </div>
        )}
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

  const defaultRenderConfidence = useCallback(
    (confidenceData: AnswerConfidence) => (
      <div className="react-af-answer-confidence">
        <strong>Confidence Assessment:</strong>
        <div>
          <strong>Answer Confidence:</strong> {(confidenceData.answer_confidence * 100).toFixed(1)}%
        </div>
        <div>
          <strong>Context Relevance:</strong> {(confidenceData.context_relevance * 100).toFixed(1)}%
        </div>
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

  // Fallback mode detection
  // We're in fallback mode when:
  // 1. There's an error OR no answer was generated (after streaming completed)
  // 2. We have search hits available
  // 3. Fallback behavior is not 'show-error'
  const canFallback = hits.length > 0 && fallbackBehavior !== 'show-error';
  const hasAnswerFailure = !isStreaming && (error || (!answer && !reasoning && hasSubmitted));
  const isFallbackMode = canFallback && hasAnswerFailure;
  const errorType: AnswerErrorType = error ? classifyAnswerError(error) : 'unknown';

  // Track if we've already fired the onFallback callback for this submission
  const fallbackFiredRef = useRef<number | undefined>(undefined);

  // Call onFallback when entering fallback mode
  useEffect(() => {
    if (isFallbackMode && onFallback && previousSubmissionRef.current !== fallbackFiredRef.current) {
      fallbackFiredRef.current = previousSubmissionRef.current;
      onFallback(errorType, hits, error || 'No answer generated');
    }
  }, [isFallbackMode, onFallback, errorType, hits, error]);

  // Default fallback renderer - shows hits prominently with an optional notice
  const defaultRenderFallback = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (hitList: QueryHit[], errType: AnswerErrorType, _errMessage: string) => {
      const noticeMessages: Record<AnswerErrorType, string> = {
        'rate-limit': 'AI answer temporarily unavailable due to rate limits. Showing search results instead.',
        'timeout': 'AI answer timed out. Showing search results instead.',
        'generation-failed': 'AI answer generation failed. Showing search results instead.',
        'network': 'Network error occurred. Showing search results instead.',
        'unknown': 'Showing search results.',
      };

      return (
        <div className="react-af-answer-fallback">
          {fallbackBehavior === 'auto' && (
            <div className="react-af-answer-fallback-notice">
              {noticeMessages[errType]}
            </div>
          )}
          <div className="react-af-answer-fallback-hits">
            <ul>
              {hitList.map((hit, idx) => (
                <li key={hit._id || idx} className="react-af-answer-fallback-hit">
                  <strong>Score:</strong> {hit._score.toFixed(3)}
                  <pre>{JSON.stringify(hit._source, null, 2)}</pre>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    },
    [fallbackBehavior],
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
        {/* Fallback mode: show hits as primary content when answer fails */}
        {isFallbackMode ? (
          renderFallback
            ? renderFallback(hits, errorType, error || 'No answer generated')
            : defaultRenderFallback(hits, errorType, error || 'No answer generated')
        ) : (
          <>
            {/* Error display - only when not in fallback mode */}
            {error && (
              <div className="react-af-answer-error" style={{ color: "red" }}>
                Error: {error}
              </div>
            )}
            {/* Loading state */}
            {!error && !answer && !reasoning && isStreaming && (
              renderLoading ? renderLoading() : (
                <div className="react-af-answer-loading">
                  Loading answer...
                </div>
              )
            )}
            {/* Empty state - only when not submitted yet */}
            {!error && !answer && !isStreaming && !hasSubmitted && (
              renderEmpty ? renderEmpty() : (
                <div className="react-af-answer-empty">
                  No results yet. Submit a question to get started.
                </div>
              )
            )}
            {/* Classification */}
            {showClassification && classification && (
              renderClassification ? renderClassification(classification) : defaultRenderClassification(classification)
            )}
            {/* Reasoning */}
            {showReasoning && reasoning && (
              renderReasoning ? renderReasoning(reasoning, isStreaming) : defaultRenderReasoning(reasoning, isStreaming)
            )}
            {/* Answer */}
            {answer && (renderAnswer ? renderAnswer(answer, isStreaming, hits) : defaultRenderAnswer(answer, isStreaming, hits))}
            {/* Confidence */}
            {showConfidence && confidence && !isStreaming && (
              renderConfidence ? renderConfidence(confidence) : defaultRenderConfidence(confidence)
            )}
            {/* Follow-up questions */}
            {showFollowUpQuestions && followUpQuestions.length > 0 && !isStreaming && (
              renderFollowUpQuestions
                ? renderFollowUpQuestions(followUpQuestions)
                : defaultRenderFollowUpQuestions(followUpQuestions)
            )}
            {/* Hits (when not in fallback mode, shown based on showHits prop) */}
            {showHits && hits.length > 0 && (renderHits ? renderHits(hits) : defaultRenderHits(hits))}
          </>
        )}
      </div>
      {children}
    </AnswerResultsContext.Provider>
  );
}
