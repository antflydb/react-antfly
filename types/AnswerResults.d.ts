import { ReactNode } from 'react';
import { AnswerErrorType } from './utils';
import { GeneratorConfig, QueryHit, ClassificationTransformationResult, AnswerConfidence } from '@antfly/sdk';
export interface AnswerResultsProps {
    id: string;
    searchBoxId: string;
    generator: GeneratorConfig;
    systemPrompt?: string;
    table?: string;
    filterQuery?: Record<string, unknown>;
    exclusionQuery?: Record<string, unknown>;
    fields?: string[];
    semanticIndexes?: string[];
    showClassification?: boolean;
    showReasoning?: boolean;
    showFollowUpQuestions?: boolean;
    showConfidence?: boolean;
    showHits?: boolean;
    /**
     * How to handle failures when search hits are available:
     * - 'show-error': Show error message, hide hits (default legacy behavior)
     * - 'show-hits': Show hits as primary content when answer fails
     * - 'auto': Automatically show hits with a subtle notice when answer fails
     */
    fallbackBehavior?: 'show-error' | 'show-hits' | 'auto';
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
export default function AnswerResults({ id, searchBoxId, generator, systemPrompt, table, filterQuery, exclusionQuery, fields, semanticIndexes, showClassification, showReasoning, showFollowUpQuestions, showConfidence, showHits, fallbackBehavior, renderLoading, renderEmpty, renderClassification, renderReasoning, renderAnswer, renderConfidence, renderFollowUpQuestions, renderHits, renderFallback, onStreamStart, onStreamEnd, onError: onErrorCallback, onFallback, children, }: AnswerResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnswerResults.d.ts.map