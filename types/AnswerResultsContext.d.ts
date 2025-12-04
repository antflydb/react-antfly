import { AnswerAgentResult, QueryHit } from '@antfly/sdk';
export interface AnswerResultsContextValue {
    query: string;
    classification: {
        route_type: 'question' | 'search';
        improved_query: string;
        semantic_query: string;
        confidence: number;
    } | null;
    hits: QueryHit[];
    reasoning: string;
    answer: string;
    followUpQuestions: string[];
    isStreaming: boolean;
    result: AnswerAgentResult | null;
}
export declare const AnswerResultsContext: import('react').Context<AnswerResultsContextValue | null>;
export declare function useAnswerResultsContext(): AnswerResultsContextValue;
//# sourceMappingURL=AnswerResultsContext.d.ts.map