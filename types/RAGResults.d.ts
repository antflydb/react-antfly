import { ReactNode } from 'react';
import { ModelConfig, Citation, QueryHit } from '@antfly/sdk';
export interface RAGResultsProps {
    id: string;
    answerBoxId: string;
    summarizer: ModelConfig;
    systemPrompt?: string;
    table?: string;
    renderSummary?: (summary: string, isStreaming: boolean, citations?: Citation[], hits?: QueryHit[]) => ReactNode;
    showCitations?: boolean;
    withCitations?: boolean;
    showHits?: boolean;
    fields?: string[];
}
export default function RAGResults({ id, answerBoxId, summarizer, systemPrompt, table, renderSummary, showCitations, withCitations, showHits, fields, }: RAGResultsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=RAGResults.d.ts.map