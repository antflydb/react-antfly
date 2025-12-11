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
     * Custom render function for the comment input.
     * If not provided, a default textarea is rendered.
     *
     * @param comment - Current comment value
     * @param setComment - Callback to update the comment value
     * @returns ReactNode to render the comment input
     */
    renderComment?: (comment: string, setComment: (value: string) => void) => ReactNode;
    /**
     * Custom render function for the submit button.
     * If not provided, a default button is rendered.
     *
     * @param onSubmit - Callback to submit the feedback
     * @returns ReactNode to render the submit button
     */
    renderSubmit?: (onSubmit: () => void) => ReactNode;
    /**
     * Custom render function for the submitted state.
     * If not provided, a default thank you message is rendered.
     *
     * @returns ReactNode to render after submission
     */
    renderSubmitted?: () => ReactNode;
    /**
     * Callback invoked when the user submits feedback.
     * Provides the feedback result along with the complete context (RAG or Answer Agent).
     *
     * @param data.feedback - The user's feedback (rating, scale, optional comment)
     * @param data.result - The result (RAG or Answer Agent)
     * @param data.query - The original query string
     * @param data.context - Additional context from Answer Agent (classification, reasoning, agentKnowledge) if available
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
            agentKnowledge?: string;
        };
    }) => void;
}
export default function AnswerFeedback({ scale, renderRating, renderComment, renderSubmit, renderSubmitted, onFeedback, }: AnswerFeedbackProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=AnswerFeedback.d.ts.map