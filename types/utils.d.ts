import { AntflyClient, QueryRequest, QueryResponses } from '@antfly/sdk';
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
//# sourceMappingURL=utils.d.ts.map