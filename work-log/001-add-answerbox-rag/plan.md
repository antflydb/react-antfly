# Plan: Add AnswerBox and RAG Results Components

## Goal

Implement an AnswerBox component and RAG (Retrieval-Augmented Generation) results display that allows users to ask questions and receive AI-generated summaries in real-time, alongside traditional search results.

## Context

Based on the OpenAPI spec (`/rag` endpoint at lines 102-139 in `../openapi.yaml`), the RAG endpoint:
- Accepts a `RAGRequest` containing a query and summarizer configuration
- Returns Server-Sent Events (SSE) stream (`text/event-stream`)
- Streams summary chunks in real-time for progressive rendering

## Requirements

1. **AnswerBox Component**: Similar to SearchBox but only executes queries on explicit user action
   - Execute query only on button click or Enter key press
   - Do NOT execute on every keystroke (unlike SearchBox)
   - Support same query types as SearchBox (semantic, full-text, custom)

2. **RAG Results Component**: Display streaming AI-generated summaries
   - Connect to `/rag` endpoint via SSE
   - Stream and render summary chunks in real-time
   - Display source documents used for the summary
   - Handle loading, error, and completed states

3. **Regular Results Component**: Display traditional search results
   - Use existing Results component
   - Both RAG and regular results should work simultaneously
   - Each should have unique IDs to coexist

## Architecture

### Component Hierarchy

```
<Antfly>
  <AnswerBox id="question" />

  <RAGResults
    id="rag-answer"
    answerBoxId="question"
  />

  <Results
    id="search-results"
    items={...}
  />
</Antfly>
```

### Key Differences from SearchBox

| Feature | SearchBox | AnswerBox |
|---------|-----------|-----------|
| Query Trigger | Every keystroke (onChange) | Button click / Enter key only |
| Debouncing | Yes (via Listener) | Not needed (explicit trigger) |
| Use Case | Real-time search-as-you-type | Explicit Q&A submission |

### RAG Endpoint Integration

The RAG endpoint requires:

```typescript
interface RAGRequest {
  query: QueryRequest;      // Standard Antfly query
  summarizer: ModelConfig;  // LLM configuration (OpenAI, Ollama, etc.)
  system_prompt?: string;   // Optional prompt to guide summarization
}
```

Response format (SSE stream):
```
data: {"chunk": "The answer to your question is..."}

data: {"chunk": " based on the following sources:"}

data: {"chunk": " [source 1, source 2]"}

data: [DONE]
```

## Implementation Plan

### Phase 1: AnswerBox Component

**File**: `src/AnswerBox.tsx`

**Key Features**:
- Form with input and submit button
- Local state for input value (doesn't trigger queries on change)
- `handleSubmit` function that calls `update()` only on submission
- Support Enter key submission
- Optional `onSubmit` callback prop for custom behavior

**Props**:
```typescript
interface AnswerBoxProps {
  customQuery?: (query?: string) => unknown;
  fields?: string[];
  id: string;
  initialValue?: string;
  placeholder?: string;
  semanticIndexes?: string[];
  limit?: number;
  children?: ReactNode;
  buttonLabel?: string;
  onSubmit?: (value: string) => void;
}
```

### Phase 2: RAG Utility Function

**File**: `src/utils.ts` (add to existing)

**Function**: `streamRAG()`

```typescript
async function streamRAG(
  url: string,
  request: RAGRequest,
  headers: Record<string, string>,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void>
```

**Responsibilities**:
- Create SSE connection to `/rag` endpoint
- Parse SSE events
- Call `onChunk` for each data chunk
- Call `onComplete` when stream ends
- Call `onError` on failures
- Handle connection cleanup

### Phase 3: RAGResults Component

**File**: `src/RAGResults.tsx`

**Key Features**:
- Listen for changes to the associated AnswerBox widget
- Trigger RAG request when AnswerBox submits
- Stream chunks and accumulate them
- Display progressive rendering of summary
- Show loading state while streaming
- Display error states
- Optional source documents display

**Props**:
```typescript
interface RAGResultsProps {
  id: string;
  answerBoxId: string;           // ID of associated AnswerBox
  summarizer: ModelConfig;       // LLM config (required)
  systemPrompt?: string;         // Optional system prompt
  renderSummary?: (
    summary: string,
    isStreaming: boolean,
    sources?: QueryHit[]
  ) => ReactNode;
  showSources?: boolean;         // Whether to fetch/show sources
  fields?: string[];             // Fields to return from search
}
```

**State Management**:
```typescript
const [summary, setSummary] = useState("");
const [isStreaming, setIsStreaming] = useState(false);
const [error, setError] = useState<string | null>(null);
const [sources, setSources] = useState<QueryHit[]>([]);
```

**Flow**:
1. Watch for changes in the AnswerBox widget value
2. When value changes (question submitted):
   - Build RAGRequest from AnswerBox query + summarizer config
   - Call `streamRAG()` utility
   - Set `isStreaming = true`
3. As chunks arrive:
   - Accumulate to summary state
   - Re-render progressively
4. On completion:
   - Set `isStreaming = false`
   - Optionally fetch source documents via regular query
5. On error:
   - Set error state
   - Display error message

### Phase 4: Export and Documentation

**File**: `src/index.ts`

Add exports:
```typescript
export { default as AnswerBox } from "./AnswerBox";
export type { AnswerBoxProps } from "./AnswerBox";
export { default as RAGResults } from "./RAGResults";
export type { RAGResultsProps } from "./RAGResults";
```

### Phase 5: Tests

**Files**:
- `src/AnswerBox.test.tsx`
- `src/RAGResults.test.tsx`

**Test Cases**:

AnswerBox:
- ✓ Renders with placeholder
- ✓ Updates value on input change
- ✓ Does NOT trigger query on keystroke
- ✓ Triggers query on button click
- ✓ Triggers query on Enter key
- ✓ Calls onSubmit callback when provided
- ✓ Disables button when input is empty

RAGResults:
- ✓ Renders loading state initially
- ✓ Streams chunks progressively
- ✓ Displays complete summary when done
- ✓ Handles errors gracefully
- ✓ Fetches and displays sources if enabled
- ✓ Cleans up SSE connection on unmount

## Usage Example

```tsx
import { Antfly, AnswerBox, Results, RAGResults } from "@antfly/components";

function App() {
  return (
    <Antfly url="http://localhost:8080" table="documents">
      {/* Question input - only queries on submit */}
      <AnswerBox
        id="question"
        fields={["content", "title"]}
        placeholder="Ask a question about your documents..."
        buttonLabel="Get Answer"
      />

      {/* Streaming RAG Summary */}
      <RAGResults
        id="rag-answer"
        answerBoxId="question"
        summarizer={{
          provider: "openai",
          model: "gpt-4",
          api_key: process.env.OPENAI_API_KEY
        }}
        systemPrompt="You are a helpful assistant. Answer based on the provided context."
        showSources={true}
        renderSummary={(summary, isStreaming, sources) => (
          <div className="rag-answer">
            <h2>AI Answer {isStreaming && <span className="loading">...</span>}</h2>
            <p>{summary}</p>
            {sources && sources.length > 0 && (
              <details>
                <summary>Sources ({sources.length})</summary>
                <ul>
                  {sources.map((s, i) => (
                    <li key={i}>{s._source?.title || s._id}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      />

      {/* Traditional Search Results */}
      <Results
        id="search-results"
        itemsPerPage={10}
        items={(data) => (
          <div className="search-results">
            <h3>Related Documents</h3>
            <ul>
              {data.map((hit) => (
                <li key={hit._id}>
                  <h4>{hit._source?.title}</h4>
                  <p>{hit._source?.content}</p>
                  <small>Score: {hit._score}</small>
                </li>
              ))}
            </ul>
          </div>
        )}
      />
    </Antfly>
  );
}
```

## Technical Considerations

### SSE Connection Management

- Use native browser `EventSource` API or `fetch` with streaming
- Properly handle connection cleanup in `useEffect` cleanup function
- Handle reconnection on errors (with exponential backoff)
- Support abort controller for cancellation

### State Coordination

- AnswerBox updates its widget state on submit
- RAGResults watches AnswerBox widget state changes
- Regular Results component also watches same query state
- Both can coexist because they have different IDs

### Error Handling

- Network errors during SSE streaming
- Invalid summarizer configuration
- Backend errors (500, 400)
- Timeout handling for long-running requests

### Performance

- Debounce not needed (explicit submission)
- Clean up SSE connections properly
- Consider max summary length limits
- Progressive rendering should not cause layout thrashing

## Open Questions

1. **Should RAGResults trigger a regular query for sources, or does the RAG endpoint return them?**
   - Current plan: RAG endpoint streams summary only, trigger separate query for sources if needed

2. **Should AnswerBox clear after submission?**
   - Current plan: No, keep value for context (user can clear manually)

3. **How to handle multiple concurrent RAG requests?**
   - Current plan: Cancel previous request when new one starts (abort controller)

4. **Should summarizer config be global (Antfly provider) or per-component?**
   - Current plan: Per-component for flexibility, but could add global default

## Success Criteria

- [ ] AnswerBox only queries on submit (not on keystroke)
- [ ] RAG summary streams in real-time
- [ ] Both RAG and regular results display simultaneously
- [ ] Error states handled gracefully
- [ ] SSE connections cleaned up properly
- [ ] Tests pass with >80% coverage
- [ ] Storybook examples demonstrate usage
- [ ] TypeScript types are exported correctly

## Non-Goals

- Auto-submit on blur (keep explicit submission only)
- Voice input (can be added later)
- Multi-turn conversation (single Q&A for now)
- Caching RAG responses (let backend handle)
