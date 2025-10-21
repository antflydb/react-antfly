import { ReactNode } from 'react';
import { ModelConfig, QueryHit } from '@antfly/sdk';
export interface RAGResultsProps {
    id: string;
    answerBoxId: string;
    summarizer: ModelConfig;
    systemPrompt?: string;
    renderSummary?: (summary: string, isStreaming: boolean, sources?: QueryHit[]) => ReactNode;
    showSources?: boolean;
    fields?: string[];
}
export default function RAGResults({ id, answerBoxId, summarizer, systemPrompt, renderSummary, showSources, fields, }: RAGResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RAGResults.d.ts.map