import { ReactNode } from "react";
import { SharedState, SharedAction } from "./SharedContext";
export interface SharedContextProviderProps {
    reducer: (state: SharedState, action: SharedAction) => SharedState;
    initialState: SharedState;
    children: ReactNode;
}
export declare const SharedContextProvider: ({ reducer, initialState, children, }: SharedContextProviderProps) => import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=SharedContextProvider.d.ts.map