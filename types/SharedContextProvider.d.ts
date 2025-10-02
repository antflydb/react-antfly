import { QueryHit, TermFacetResult } from "@antfly/sdk";
import React, { ReactNode, Dispatch } from "react";
export interface Widget {
    id: string;
    needsQuery?: boolean;
    needsConfiguration?: boolean;
    isFacet?: boolean;
    rootQuery?: boolean;
    isAutosuggest?: boolean;
    wantResults?: boolean;
    query?: unknown;
    semanticQuery?: string;
    isSemantic?: boolean;
    value?: unknown;
    configuration?: {
        fields?: string[];
        size?: number;
        filterValue?: string;
        useCustomQuery?: boolean;
        [key: string]: unknown;
    };
    result?: {
        data?: QueryHit[];
        facetData?: TermFacetResult[];
        total?: number | {
            value: number;
        };
        error?: string;
    };
}
export interface SharedState {
    url?: string;
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
    query?: unknown;
    semanticQuery?: string;
    isSemantic?: boolean;
    value?: unknown;
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
export declare const SharedContext: React.Context<SharedContextType>;
export interface SharedContextProviderProps {
    reducer: (state: SharedState, action: SharedAction) => SharedState;
    initialState: SharedState;
    children: ReactNode;
}
export declare const SharedContextProvider: ({ reducer, initialState, children, }: SharedContextProviderProps) => import("react/jsx-runtime").JSX.Element;
export declare const useSharedContext: () => [SharedState, Dispatch<SharedAction>];
//# sourceMappingURL=SharedContextProvider.d.ts.map