import React, { useState, useCallback, ReactNode } from "react";
import { useRAGResultsContext } from "./RAGResults";
import { RAGResult } from "@antfly/sdk";

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
   * Provides the feedback result along with the complete RAG context.
   *
   * @param data.feedback - The user's feedback (rating, scale, optional comment)
   * @param data.result - The RAG result (summary + search hits)
   * @param data.query - The original query string
   */
  onFeedback: (data: { feedback: FeedbackResult; result: RAGResult; query: string }) => void;

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
}

export default function AnswerFeedback({
  scale,
  renderRating,
  enableComments = true,
  onFeedback,
  commentPlaceholder = "Add a comment (optional)",
  submitLabel = "Submit Feedback",
}: AnswerFeedbackProps) {
  const { query, result, isStreaming } = useRAGResultsContext();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [showCommentField, setShowCommentField] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

    onFeedback({
      feedback: feedbackData,
      result,
      query,
    });

    setSubmitted(true);
  }, [rating, scale, comment, result, query, onFeedback]);

  // Don't show feedback UI while streaming or if already submitted
  if (isStreaming || submitted) {
    return null;
  }

  // Don't show feedback if there's no result yet
  if (!result) {
    return null;
  }

  return (
    <div className="react-af-answer-feedback">
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
