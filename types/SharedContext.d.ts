import { QueryHit, TermFacetResult } from '@antfly/sdk';
import { Dispatch } from 'react';
export interface Widget {
    id: string;
    needsQuery?: boolean;
    needsConfiguration?: boolean;
    isFacet?: boolean;
    rootQuery?: boolean;
    isAutosuggest?: boolean;
    wantResults?: boolean;
    wantFacets?: boolean;
    query?: unknown;
    semanticQuery?: string;
    isSemantic?: boolean;
    value?: unknown;
    submittedAt?: number;
    table?: string | string[];
    filterQuery?: unknown;
    exclusionQuery?: unknown;
    facetOptions?: Array<{
        field: string;
        size?: number;
    }>;
    isLoading?: boolean;
    configuration?: {
        fields?: string[];
        size?: number;
        filterValue?: string;
        useCustomQuery?: boolean;
        [key: string]: unknown;
    };
    result?: {
        data?: QueryHit[];
        facetData?: TermFacetResult[] | TermFacetResult[][];
        total?: number | {
            value: number;
        };
        error?: string;
    };
}
export interface SharedState {
    url?: string;
    table: string;
    listenerEffect?: (() => void) | null;
    widgets: Map<string, Widget>;
    headers?: Record<string, string>;
}
export type SharedAction = {
    type: "setWidget";
    key: string;
    needsQuery?: boolean;
    needsConfiguration?: boolean;
    isFacet?: boolean;
    rootQuery?: boolean;
    isAutosuggest?: boolean;
    wantResults?: boolean;
    wantFacets?: boolean;
    query?: unknown;
    semanticQuery?: string;
    isSemantic?: boolean;
    value?: unknown;
    submittedAt?: number;
    table?: string | string[];
    filterQuery?: unknown;
    exclusionQuery?: unknown;
    facetOptions?: Array<{
        field: string;
        size?: number;
    }>;
    isLoading?: boolean;
    configuration?: Widget["configuration"];
    result?: Widget["result"];
} | {
    type: "deleteWidget";
    key: string;
} | {
    type: "setListenerEffect";
    value: (() => void) | null;
};
export type SharedContextType = [SharedState, Dispatch<SharedAction>] | null;
export declare const SharedContext: import('react').Context<SharedContextType>;
export declare const useSharedContext: () => [SharedState, Dispatch<SharedAction>];
//# sourceMappingURL=SharedContext.d.ts.map