import { createContext, useContext } from "react";
import { QueryHit, AnswerAgentResult } from "@antfly/sdk";

// Context for sharing Answer Agent data with child components (e.g., AnswerFeedback)
export interface AnswerResultsContextValue {
  query: string;
  classification: {
    route_type: "question" | "search";
    improved_query: string;
    semantic_query: string;
    confidence: number;
  } | null;
  hits: QueryHit[];
  reasoning: string;
  answer: string;
  followUpQuestions: string[];
  isStreaming: boolean;
  result: AnswerAgentResult | null;
}

export const AnswerResultsContext = createContext<AnswerResultsContextValue | null>(null);

export function useAnswerResultsContext() {
  const context = useContext(AnswerResultsContext);
  if (!context) {
    throw new Error("useAnswerResultsContext must be used within an AnswerResults component");
  }
  return context;
}
