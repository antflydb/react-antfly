import { AntflyClient, QueryRequest, QueryResponses, RAGRequest, RAGResult } from '@antfly/sdk';
export interface MultiqueryRequest {
    query: QueryRequest;
}
export declare function initializeAntflyClient(url: string, headers?: Record<string, string>): AntflyClient;
export declare function getAntflyClient(): AntflyClient;
export declare function msearch(url: string, msearchData: MultiqueryRequest[], headers?: Record<string, string>): Promise<QueryResponses | undefined>;
export declare function conjunctsFrom(queries?: Map<string, unknown>): Record<string, unknown>;
export declare function disjunctsFrom(queries?: Array<Record<string, unknown>>): Record<string, unknown>;
export declare function toTermQueries(fields?: string[], selectedValues?: string[]): Array<Record<string, unknown>>;
export declare function fromUrlQueryString(str?: string): Map<string, unknown>;
export declare function toUrlQueryString(params: Map<string, unknown>): string;
export declare const defer: (f: () => void) => void;
export interface SSEChunk {
    chunk?: string;
    error?: string;
}
/**
 * Stream RAG results from the Antfly /rag endpoint using Server-Sent Events or JSON
 * @param url - Base URL of the Antfly server
 * @param request - RAG request containing query and summarizer config
 * @param headers - Optional HTTP headers for authentication
 * @param onChunk - Callback for each chunk of the summary (used in streaming mode)
 * @param onComplete - Callback when the stream completes
 * @param onError - Callback for errors
 * @param onRAGResult - Callback for RAG result with query results and summary (used when with_citations is true)
 * @returns AbortController to cancel the stream
 */
export declare function streamRAG(url: string, request: RAGRequest, headers: Record<string, string> | undefined, onChunk: (chunk: string) => void, onComplete: () => void, onError: (error: Error) => void, onRAGResult?: (result: RAGResult) => void): Promise<AbortController>;
//# sourceMappingURL=utils.d.ts.map