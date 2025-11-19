import { ReactNode } from 'react';
import { GeneratorConfig, QueryHit } from '@antfly/sdk';
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
    showHits?: boolean;
    renderLoading?: () => ReactNode;
    renderEmpty?: () => ReactNode;
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
    onStreamStart?: () => void;
    onStreamEnd?: () => void;
    onError?: (error: string) => void;
    children?: ReactNode;
}
export default function AnswerResults({ id, searchBoxId, generator, systemPrompt, table, filterQuery, exclusionQuery, fields, semanticIndexes, showClassification, showReasoning, showFollowUpQuestions, showHits, renderLoading, renderEmpty, renderClassification, renderReasoning, renderAnswer, renderFollowUpQuestions, renderHits, onStreamStart, onStreamEnd, onError: onErrorCallback, children, }: AnswerResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnswerResults.d.ts.map