import { ReactNode } from 'react';
import { ModelConfig, Citation } from '@antfly/sdk';
export interface RAGResultsProps {
    id: string;
    answerBoxId: string;
    summarizer: ModelConfig;
    systemPrompt?: string;
    renderSummary?: (summary: string, isStreaming: boolean, citations?: Citation[]) => ReactNode;
    showCitations?: boolean;
    withCitations?: boolean;
    fields?: string[];
}
export default function RAGResults({ id, answerBoxId, summarizer, systemPrompt, renderSummary, showCitations, withCitations, fields, }: RAGResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RAGResults.d.ts.map