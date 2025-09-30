import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";

export interface Widget {
  id: string;
  needsQuery?: boolean;
  needsConfiguration?: boolean;
  isFacet?: boolean;
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
    data?: unknown[];
    total?: number | { value: number };
    error?: string;
  };
}

export interface SharedState {
  url?: string;
  listenerEffect?: (() => void) | null;
  widgets: Map<string, Widget>;
  headers?: Record<string, string>;
}

export type SharedAction =
  | {
      type: "setWidget";
      key: string;
      needsQuery?: boolean;
      needsConfiguration?: boolean;
      isFacet?: boolean;
      wantResults?: boolean;
      query?: unknown;
      semanticQuery?: string;
      isSemantic?: boolean;
      value?: unknown;
      configuration?: Widget["configuration"];
      result?: Widget["result"];
    }
  | {
      type: "deleteWidget";
      key: string;
    }
  | {
      type: "setListenerEffect";
      value: (() => void) | null;
    };

export type SharedContextType = [SharedState, Dispatch<SharedAction>] | null;

export const SharedContext = createContext<SharedContextType>(null);

export interface SharedContextProviderProps {
  reducer: (state: SharedState, action: SharedAction) => SharedState;
  initialState: SharedState;
  children: ReactNode;
}

export const SharedContextProvider = ({
  reducer,
  initialState,
  children,
}: SharedContextProviderProps) => {
  return (
    <SharedContext.Provider value={useReducer(reducer, initialState)}>
      {children}
    </SharedContext.Provider>
  );
};

export const useSharedContext = (): [SharedState, Dispatch<SharedAction>] => {
  const context = useContext(SharedContext);
  if (!context) {
    throw new Error("useSharedContext must be used within a SharedContextProvider");
  }
  return context;
};
