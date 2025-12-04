import { AnswerAgentResult, RAGResult } from '@antfly/sdk';
import { ReactNode } from 'react';
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
            classification?: {
                route_type: 'question' | 'search';
                confidence: number;
            };
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
export default function AnswerFeedback({ scale, renderRating, enableComments, onFeedback, commentPlaceholder, submitLabel, thankYouMessage, heading, }: AnswerFeedbackProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=AnswerFeedback.d.ts.map