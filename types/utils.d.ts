import { QueryHit, AntflyClient, QueryRequest, QueryResponses, RAGRequest, RAGResult } from '@antfly/sdk';
export interface MultiqueryRequest {
    query: QueryRequest;
}
export declare function initializeAntflyClient(url: string, headers?: Record<string, string>): AntflyClient;
export declare function getAntflyClient(): AntflyClient;
export declare function multiquery(url: string, msearchData: MultiqueryRequest[], headers?: Record<string, string>): Promise<QueryResponses | undefined>;
export declare function conjunctsFrom(queries?: Map<string, unknown>): Record<string, unknown>;
export declare function disjunctsFrom(queries?: Array<Record<string, unknown>>): Record<string, unknown>;
export declare function toTermQueries(fields?: string[], selectedValues?: string[]): Array<Record<string, unknown>>;
export declare function fromUrlQueryString(str?: string): Map<string, unknown>;
export declare function toUrlQueryString(params: Map<string, unknown>): string;
export declare const defer: (f: () => void) => void;
/**
 * Normalize table parameter to array format (internal use)
 * Supports future multi-table queries while maintaining backwards compatibility
 */
export declare function normalizeTable(table?: string | string[]): string[];
/**
 * Resolve which table to use for a widget query
 * Priority: widget.table > defaultTable
 * Returns single table for Phase 1 (can be extended to return array in Phase 2)
 */
export declare function resolveTable(widgetTable: string | string[] | undefined, defaultTable: string): string;
export interface RAGCallbacks {
    onHit?: (hit: QueryHit) => void;
    onSummary?: (chunk: string) => void;
    onComplete?: () => void;
    onError?: (error: Error | string) => void;
    onRAGResult?: (result: RAGResult) => void;
}
/**
 * Stream RAG results from the Antfly /rag endpoint using Server-Sent Events or JSON
 * @param url - Base URL of the Antfly server (e.g., http://localhost:8080/api/v1)
 * @param tableName - Required table name for the RAG query
 * @param request - RAG request containing queries and summarizer config
 * @param headers - Optional HTTP headers for authentication
 * @param callbacks - Structured callbacks for RAG events (hit, summary, citation, complete, error, ragResult)
 * @returns AbortController to cancel the stream
 */
export declare function streamRAG(url: string, tableName: string, request: RAGRequest, headers: Record<string, string> | undefined, callbacks: RAGCallbacks): Promise<AbortController>;
//# sourceMappingURL=utils.d.ts.map