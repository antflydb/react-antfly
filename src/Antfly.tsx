import React, { ReactNode, useEffect } from "react";
import { SharedContextProvider } from "./SharedContextProvider";
import { SharedState, SharedAction } from "./SharedContext";
import { initializeAntflyClient } from "./utils";
import Listener from "./Listener";

export interface AntflyProps {
  children: ReactNode;
  url: string; // Base URL only (e.g., http://localhost:8080/api/v1)
  table: string; // Required default table for all widgets
  onChange?: (params: Map<string, unknown>) => void;
  headers?: Record<string, string>;
}

export default function Antfly({ children, url, table, onChange, headers = {} }: AntflyProps) {
  const initialState: SharedState = {
    url,
    table,
    listenerEffect: null,
    widgets: new Map(),
    headers,
  };

  useEffect(() => {
    initializeAntflyClient(url, headers);
  }, [url, headers]);

  const reducer = (state: SharedState, action: SharedAction): SharedState => {
    switch (action.type) {
      case "setWidget": {
        const widget = {
          id: action.key,
          needsQuery: action.needsQuery,
          needsConfiguration: action.needsConfiguration,
          isFacet: action.isFacet,
          wantResults: action.wantResults,
          query: action.query,
          rootQuery: action.rootQuery,
          semanticQuery: action.semanticQuery,
          isSemantic: action.isSemantic,
          isAutosuggest: action.isAutosuggest,
          value: action.value,
          submittedAt: action.submittedAt,
          table: action.table,
          configuration: action.configuration,
          result: action.result,
        };
        // Create a new Map to maintain immutability
        const newWidgets = new Map(state.widgets);
        newWidgets.set(action.key, widget);
        return { ...state, widgets: newWidgets };
      }
      case "deleteWidget": {
        // Create a new Map to maintain immutability
        const newWidgets = new Map(state.widgets);
        newWidgets.delete(action.key);
        return { ...state, widgets: newWidgets };
      }
      case "setListenerEffect":
        return { ...state, listenerEffect: action.value };
      default:
        return state;
    }
  };

  return (
    <SharedContextProvider initialState={initialState} reducer={reducer}>
      <Listener onChange={onChange}>{children}</Listener>
    </SharedContextProvider>
  );
}
