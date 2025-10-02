import React, { useReducer, ReactNode } from "react";
import { SharedContext, SharedState, SharedAction } from "./SharedContext";

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

