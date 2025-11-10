import React, { useState, useCallback, ReactNode, useContext, useEffect, useRef } from "react";
import { RAGResultsContext } from "./RAGResults";
import { AnswerResultsContext } from "./AnswerResultsContext";
import { RAGResult, AnswerAgentResult } from "@antfly/sdk";

export interface FeedbackResult {
  rating: number;
  scale: number;
  comment?: string;
}

export interface AnswerFeedbackProps {
  /**
   * Maximum value of the rating scale. The rating will range from 0 to scale.
   * Examples:
   * - scale=1 for thumbs up/down (0 or 1)
   * - scale=4 for 5-star rating (0-4)
   * - scale=3 for 4-point scale (0-3)
   */
  scale: number;

  /**
   * Custom render function for the rating UI.
   * If not provided, developers must supply their own UI.
   *
   * @param currentRating - Currently selected rating (0-scale) or null if not rated
   * @param onRate - Callback to set a rating value (must be 0-scale)
   * @returns ReactNode to render the rating UI
   *
   * @example Using a default renderer
   * ```tsx
   * import { renderThumbsUpDown } from '@antfly/components';
   * <AnswerFeedback scale={1} renderRating={renderThumbsUpDown} onFeedback={...} />
   * ```
   */
  renderRating?: (currentRating: number | null, onRate: (rating: number) => void) => ReactNode;

  /**
   * Whether to enable optional text comments.
   * When true, a comment field will appear after the user selects a rating.
   * @default true
   */
  enableComments?: boolean;

  /**
   * Callback invoked when the user submits feedback.
   * Provides the feedback result along with the complete context (RAG or Answer Agent).
   *
   * @param data.feedback - The user's feedback (rating, scale, optional comment)
   * @param data.result - The result (RAG or Answer Agent)
   * @param data.query - The original query string
   * @param data.context - Additional context from Answer Agent (classification, reasoning) if available
   */
  onFeedback: (data: {
    feedback: FeedbackResult;
    result: RAGResult | AnswerAgentResult;
    query: string;
    context?: {
      classification?: { route_type: "question" | "search"; confidence: number };
      reasoning?: string;
    };
  }) => void;

  /**
   * Placeholder text for the optional comment field
   * @default "Add a comment (optional)"
   */
  commentPlaceholder?: string;

  /**
   * Label for the submit button
   * @default "Submit Feedback"
   */
  submitLabel?: string;

  /**
   * Message to show after feedback is submitted
   * @default "Thank you for your feedback!"
   */
  thankYouMessage?: string;

  /**
   * Optional heading to show before feedback is submitted
   * If not provided, no heading is shown
   */
  heading?: string;
}

export default function AnswerFeedback({
  scale,
  renderRating,
  enableComments = true,
  onFeedback,
  commentPlaceholder = "Add a comment (optional)",
  submitLabel = "Submit Feedback",
  thankYouMessage = "Thank you for your feedback!",
  heading,
}: AnswerFeedbackProps) {
  // Try to use Answer context first, fall back to RAG context
  const answerContext = useContext(AnswerResultsContext);
  const ragContext = useContext(RAGResultsContext);

  // Determine which context to use
  const activeContext = answerContext || ragContext;

  if (!activeContext) {
    throw new Error("AnswerFeedback must be used within either a RAGResults or AnswerResults component");
  }

  const { query, isStreaming } = activeContext;
  const result = answerContext?.result || ragContext?.result || null;

  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [showCommentField, setShowCommentField] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const previousQueryRef = useRef<string>(query);

  // Reset feedback state when query changes (new question submitted)
  useEffect(() => {
    if (previousQueryRef.current !== query) {
      previousQueryRef.current = query;
      setRating(null);
      setComment("");
      setShowCommentField(false);
      setSubmitted(false);
    }
  }, [query]);

  // Validate and set rating
  const handleRate = useCallback(
    (value: number) => {
      if (value < 0 || value > scale) {
        console.error(
          `AnswerFeedback: Invalid rating ${value}. Must be between 0 and ${scale}.`,
        );
        return;
      }
      setRating(value);
      if (enableComments) {
        setShowCommentField(true);
      }
    },
    [scale, enableComments],
  );

  // Handle feedback submission
  const handleSubmit = useCallback(() => {
    if (rating === null) {
      console.warn("AnswerFeedback: Cannot submit without a rating");
      return;
    }

    if (!result) {
      console.warn("AnswerFeedback: Cannot submit feedback without a result");
      return;
    }

    const feedbackData: FeedbackResult = {
      rating,
      scale,
      ...(comment && { comment }),
    };

    // Build context object for Answer Agent (if available)
    const contextData = answerContext
      ? {
          classification: answerContext.classification || undefined,
          reasoning: answerContext.reasoning || undefined,
        }
      : undefined;

    onFeedback({
      feedback: feedbackData,
      result,
      query,
      ...(contextData && { context: contextData }),
    });

    setSubmitted(true);
  }, [rating, scale, comment, result, query, answerContext, onFeedback]);

  // Don't show feedback UI while streaming
  if (isStreaming) {
    return null;
  }

  // Show thank you message after submission
  if (submitted) {
    return (
      <h4 className="react-af-answer-feedback-submitted">
        {thankYouMessage}
      </h4>
    );
  }

  // Don't show feedback if there's no result yet
  if (!result) {
    return null;
  }

  // Check if answer/summary has actual content before showing feedback
  // For Answer context, check that answer text exists
  if (answerContext) {
    if (!answerContext.answer || answerContext.answer.trim() === "") {
      return null;
    }
  }
  // For RAG context, check that summary exists
  else if (ragContext) {
    if (!ragContext.result?.summary_result?.summary || ragContext.result.summary_result.summary.trim() === "") {
      return null;
    }
  }
  // If neither context has content, don't render
  else {
    return null;
  }

  return (
    <div className="react-af-answer-feedback">
      {/* Optional heading */}
      {heading && <h4 className="react-af-feedback-heading">{heading}</h4>}

      {/* Rating UI */}
      <div className="react-af-feedback-rating">
        {renderRating ? renderRating(rating, handleRate) : null}
      </div>

      {/* Optional comment field (shown after rating) */}
      {enableComments && showCommentField && (
        <div className="react-af-feedback-comment">
          <textarea
            className="react-af-feedback-comment-input"
            placeholder={commentPlaceholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>
      )}

      {/* Submit button (shown after rating) */}
      {rating !== null && (
        <div className="react-af-feedback-actions">
          <button
            type="button"
            className="react-af-feedback-submit"
            onClick={handleSubmit}
          >
            {submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}
