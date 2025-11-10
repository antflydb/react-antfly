import { ReactNode } from 'react';
import { GeneratorConfig, QueryHit } from '@antfly/sdk';
export interface AnswerResultsProps {
    id: string;
    answerBoxId: string;
    generator: GeneratorConfig;
    systemPrompt?: string;
    table?: string;
    showClassification?: boolean;
    showReasoning?: boolean;
    showFollowUpQuestions?: boolean;
    showHits?: boolean;
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
export default function AnswerResults({ id, answerBoxId, generator, systemPrompt, table, showClassification, showReasoning, showFollowUpQuestions, showHits, renderClassification, renderReasoning, renderAnswer, renderFollowUpQuestions, renderHits, onStreamStart, onStreamEnd, onError: onErrorCallback, children, }: AnswerResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=AnswerResults.d.ts.map