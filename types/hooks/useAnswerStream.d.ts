import { AnswerAgentRequest } from '@antfly/sdk';
/**
 * Classification data from Answer Agent
 */
export interface QueryClassification {
    route_type: 'question' | 'search';
    improved_query: string;
    semantic_query: string;
    confidence: number;
}
/**
 * Hook for streaming Answer Agent responses with state management.
 *
 * Manages streaming answer text, reasoning, classification, hits, and follow-up questions
 * from the Antfly Answer Agent endpoint.
 *
 * @returns Object with answer state and streaming controls
 *
 * @example
 * ```typescript
 * const {
 *   answer,
 *   reasoning,
 *   classification,
 *   hits,
 *   followUpQuestions,
 *   isStreaming,
 *   error,
 *   startStream,
 *   stopStream,
 *   reset
 * } = useAnswerStream();
 *
 * // Start streaming
 * startStream({
 *   url: 'http://localhost:8080/api/v1',
 *   request: {
 *     query: 'how does raft work',
 *     tables: ['docs']
 *   },
 *   headers: { 'X-API-Key': 'key' }
 * });
 *
 * // Stop streaming
 * stopStream();
 *
 * // Reset state
 * reset();
 * ```
 */
export declare function useAnswerStream(): {
    answer: string;
    reasoning: string;
    classification: QueryClassification | null;
    hits: {
        _id: string;
        _score: number;
        _index_scores?: {
            [key: string]: unknown;
        };
        _source?: {
            [key: string]: unknown;
        };
    }[];
    followUpQuestions: string[];
    isStreaming: boolean;
    error: Error | null;
    startStream: ({ url, request, headers, }: {
        url: string;
        request: AnswerAgentRequest;
        headers?: Record<string, string>;
    }) => Promise<void>;
    stopStream: () => void;
    reset: () => void;
};
//# sourceMappingURL=useAnswerStream.d.ts.map