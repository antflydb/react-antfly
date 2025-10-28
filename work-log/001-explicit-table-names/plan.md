# Explicit Table Names in Component Configuration

**Status**: ✅ **COMPLETED** (Phase 1 implemented using Option 3)
**Implementation Date**: 2025-10-25
**Tests**: All 184 tests passing ✅

## Context

**Backend API Changes (2025-10-25)**: The Antfly backend implemented multi-table RAG support with breaking changes:
- `RAGRequest.query` → `RAGRequest.queries[]` (array of queries)
- Each `QueryRequest` now requires explicit `table` field
- Backend supports querying multiple tables in a single request
- See: `/Users/ajroetker/go/src/github.com/antflydb/antfly/work-log/003-multi-table-rag/plan.md`

This plan updates react-antfly to align with the backend API structure.

## Problem Statement

Currently, the component library infers table names from URL paths (e.g., `/table/{tableName}/query`). However:
- `QueryRequest` has a `table` field in its structure (as of backend implementation)
- `RAGRequest` now accepts `queries[]` array where each query specifies its own `table` (breaking change in backend)
- The backend already supports multi-table queries and multi-table RAG
- Table configuration should be explicit in component props for clarity and alignment with backend API
- **Critical**: The react-antfly library needs to match the backend API structure which requires explicit table specification

## Current Architecture

### Frontend (react-antfly)
1. **Root Component**: `<Antfly url="http://localhost:8080/api/v1/table/example" />`
2. **URL Parsing**: `streamRAG()` extracts table name from URL (utils.ts:153)
3. **Listener**: Uses `multiquery()` without table specification (Listener.tsx:324)
4. **Widgets**: No table configuration currently

### Backend API (Antfly Server)
1. **QueryRequest**: Has a `table` field for specifying which table to query
2. **RAGRequest**: Accepts `queries[]` array where each query is a `QueryRequest` with its own `table` field
3. **Multi-table support**: Backend fully supports querying multiple tables in a single request
4. **Streaming response**: RAG streaming emits `table_result` events for each table queried

### Alignment Gap
The frontend currently infers table from URL paths, while the backend expects explicit `table` fields in request objects. This plan bridges that gap.

## Design Decision: Clean Break (No Users)

Since we have no users currently, we can make breaking changes for the cleanest design:
- ❌ No backward compatibility needed
- ❌ No URL parsing/extraction
- ✅ Explicit table configuration required
- ✅ Simplest possible implementation
- ✅ Table passed via `QueryRequest.table` field (not as separate SDK parameter)
- ✅ **Aligns with backend API** - Backend already requires explicit `table` in queries
- ✅ **Enables multi-table RAG** - Backend supports `queries[]` with different tables (implemented 2025-10-25)

## Proposed Solution

### Design Principles

1. **Explicit table required at root level** - No magic URL parsing
2. **Optional override at widget level** - Clean and discoverable
3. **Future-proof** - Reserve API surface for multi-table queries
4. **Auto-inheritance** - RAGResults inherits from AnswerBox

### API Design

```typescript
// Root component requires explicit table
<Antfly
  url="http://localhost:8080/api/v1"  // Clean base URL only
  table="products"                     // Required default table
>
  {/* Uses default table "products" */}
  <SearchBox id="search" fields={["name", "description"]} />

  {/* Override to query "reviews" table */}
  <SearchBox
    id="review-search"
    fields={["text"]}
    table="reviews"
  />

  {/* AnswerBox with explicit table override */}
  <AnswerBox
    id="qa"
    table="documentation"
    semanticIndexes={["embeddings"]}
  />

  {/* RAGResults auto-inherits table from AnswerBox */}
  <RAGResults
    id="rag"
    answerBoxId="qa"
    // No table prop needed - inherits "documentation" from AnswerBox
    // Can override with table="other" if needed
  />
</Antfly>
```

### Table Resolution Priority

Simple two-level priority:
1. `widget.table` (if specified)
2. `Antfly.table` (default)

No URL parsing, no fallbacks, no magic.

### Future: Multi-Table Support

The backend already supports multi-table queries and RAG (implemented 2025-10-25). Future frontend work will expose this:

```typescript
// Future: Multi-table SearchBox
<SearchBox
  id="cross-search"
  tables={["products", "reviews", "articles"]}  // Future feature
  fields={["title", "content"]}
/>

// Future: Multi-table RAG (backend ready)
<AnswerBox
  id="qa"
  tables={["images", "products", "docs"]}  // Backend supports this
  semanticIndexes={["embeddings"]}
/>
<RAGResults
  id="rag"
  answerBoxId="qa"
  // Will receive table_result events for each table
  renderTableResult={(table, hits) => {
    // Type-aware rendering per table
  }}
/>
```

**Backend API structure** (already implemented):
```json
{
  "queries": [
    {"table": "images", "semantic_search": "red sneakers", "limit": 10},
    {"table": "products", "semantic_search": "red sneakers", "limit": 10},
    {"table": "docs", "semantic_search": "sneaker care", "limit": 5}
  ],
  "summarizer": {"provider": "ollama", "model": "gemma3:4b"},
  "with_streaming": true,
  "with_citations": true
}
```

## Implementation Plan

### 1. Update Type Definitions

**SharedContext.tsx**:
```typescript
export interface Widget {
  // ... existing fields
  table?: string;      // Single table override
  tables?: string[];   // Reserved for future multi-table support
}

export interface SharedState {
  url?: string;
  table: string;       // Required default table for all widgets
  // ... existing fields
}
```

### 2. Update Root Component

**Antfly.tsx**:
```typescript
export interface AntflyProps {
  children: ReactNode;
  url: string;              // Clean base URL only (no /table/{name})
  table: string;            // Required default table
  onChange?: (params: Map<string, unknown>) => void;
  headers?: Record<string, string>;
}

export default function Antfly({
  children,
  url,
  table,
  onChange,
  headers = {}
}: AntflyProps) {
  const initialState: SharedState = {
    url,
    table,                  // Store required table
    listenerEffect: null,
    widgets: new Map(),
    headers,
  };
  // ... rest of component
}
```

### 3. Update Widget Components

Add `table?: string` prop to:
- **SearchBox.tsx** (SearchBoxProps)
- **AnswerBox.tsx** (AnswerBoxProps)
- **Results.tsx** (ResultsProps)
- **RAGResults.tsx** (RAGResultsProps)
- **Facet.tsx** (FacetProps)
- **Autosuggest.tsx** (AutosuggestProps)

Example for SearchBox:
```typescript
export interface SearchBoxProps {
  // ... existing props
  table?: string;  // Override default table
}

// In update() function:
dispatch({
  type: "setWidget",
  key: id,
  table: table,  // Pass table to widget state
  // ... rest of dispatch
});
```

### 4. Update Listener Component

**Listener.tsx** - Add table to each query object (no grouping needed):

```typescript
// Inside the fetchData function:

// Process result widgets - add table to each query
resultWidgets.forEach((r, id) => {
  const tableName = r.table || table;  // Use widget table or default
  const config = r.configuration;

  if (!isSearchWidgetConfig(config)) {
    return;
  }

  const { itemsPerPage, page, sort } = config;

  // ... existing semantic query logic ...

  multiqueryData.push({
    query: {
      table: tableName,  // Add table to query object
      semantic_search: semanticQuery,
      indexes: semanticQuery ? indexes : undefined,
      full_text_search: conjunctsFrom(filteredQueries),
      limit: itemsPerPage,
      offset: (page - 1) * itemsPerPage,
      order_by: sort,
      ...(config.fields && { _source: config.fields }),
    },
    data: (result: QueryResult) => result.hits?.hits || [],
    facetData: () => [],
    total: (result: QueryResult) => result.hits?.total || 0,
    id,
  });
});

// Process facet widgets - add table to each query
facetWidgets.forEach((f, id) => {
  const tableName = f.table || table;  // Use widget table or default

  // ... existing facet query building logic ...

  multiqueryData.push({
    query: {
      table: tableName,  // Add table to query object
      semantic_search: semanticQuery,
      indexes: semanticQuery ? indexes : undefined,
      limit: semanticQuery ? limit : 0,
      full_text_search: fullTextQuery,
      facets: result,
    },
    // ... rest of facet item
  });
});

// Execute single multiquery (no table grouping needed)
const result = await multiquery(url, multiqueryData, headers);

// Process results (same as before)
```

**Key insight**: Since `QueryRequest` has a `table` field, we don't need to group by table or make multiple calls. Each query specifies its own table.

### 5. Update Utilities

**utils.ts**:

Update `multiquery()` - **No signature change needed**:
```typescript
// multiquery signature stays the same - table is in each query object
export async function multiquery(
  url: string,
  msearchData: MultiqueryRequest[],  // Each query has table field
  headers: Record<string, string> = {},
): Promise<QueryResponses | undefined> {
  try {
    let client = defaultClient;
    if (!client) {
      client = initializeAntflyClient(url, headers);
    }

    // Queries already have table field - just pass them through
    const queries = msearchData.map((item) => item.query);
    const result = await client.multiquery(queries);
    return result;
  } catch (error) {
    // ... existing error handling
  }
}
```

Update `streamRAG()` - **Remove URL parsing, add table to query**:
```typescript
export async function streamRAG(
  url: string,
  tableName: string,              // Explicit table parameter (required)
  request: RAGRequest,
  headers: Record<string, string> = {},
  callbacks: RAGCallbacks,
): Promise<AbortController> {
  try {
    // Remove all URL parsing logic:
    // const tableMatch = url.match(/\/table\/([^/]+)/);
    // const baseUrl = tableName ? url.replace(...) : url;

    const client = new AntflyClient({ baseUrl: url, headers });

    // Build RAG request with table in the query object
    // Note: Backend expects queries[] array (breaking change 2025-10-25)
    // For single-table: queries: [{ table: "...", ... }]
    const ragRequest = {
      ...request,
      queries: [
        {
          ...request.query,
          table: tableName,  // Add table to QueryRequest
        }
      ],
    };

    // Use client.rag() directly
    const result = await client.rag(ragRequest, sdkCallbacks);

    // ... rest of implementation
  } catch (error) {
    // ... error handling
  }
}
```

**Key insight**:
- `QueryRequest` has a `table` field - add it to the query object
- Backend RAG API now expects `queries[]` array instead of single `query` (breaking change)
- For single-table RAG, we wrap the query in an array with one element

### 6. Update RAGResults Component

**RAGResults.tsx**:
```typescript
export interface RAGResultsProps {
  // ... existing props
  table?: string;  // Optional - will auto-inherit from AnswerBox if not specified
}

// In useEffect for streaming:
const [{ widgets, url, table: defaultTable, headers }, dispatch] = useSharedContext();

// Auto-inherit table from AnswerBox widget if not explicitly provided
const answerBoxWidget = widgets.get(answerBoxId);
const tableName = table || answerBoxWidget?.table || defaultTable;

// Build RAG request (table will be added in streamRAG)
const ragRequest: RAGRequest = {
  query: {
    full_text_search: answerBoxQuery as Record<string, unknown> | undefined,
    semantic_search: answerBoxSemanticQuery,
    indexes: answerBoxConfiguration?.indexes as string[] | undefined,
    limit: (answerBoxConfiguration?.limit as number | undefined) || 10,
    fields: fields || [],
    // table will be added by streamRAG
  },
  summarizer,
  system_prompt: systemPrompt,
  with_citations: withCitations,
};

const controller = await streamRAG(
  url,
  tableName,  // Pass resolved table name
  ragRequest,
  headers || {},
  callbacks
);
```

**Key feature**: RAGResults automatically inherits the table from the AnswerBox it's connected to, but can be overridden if needed. The `streamRAG` utility adds the table to `ragRequest.query.table`.

## Migration Path

### Phase 1: Clean Breaking Change (Current Work)
- **BREAKING**: Make `table` required on Antfly component
- **BREAKING**: Remove all URL parsing/extraction logic
- Add optional `table` override prop to all widget components
- Update Listener to group by table and execute per-table queries
- RAGResults auto-inherits table from AnswerBox
- Update all examples and documentation

### Phase 2: Multi-Table Support (Future)

**Backend ready**: Multi-table RAG and query support already implemented (2025-10-25)

- Add `tables?: string[]` to widget props
- Update Listener to build multiple queries in `multiquery()` call
- Implement table-specific result aggregation and merging
- Design UI patterns for multi-table result display
- Handle `table_result` SSE events from multi-table RAG streaming
- Type-aware rendering per table (images vs products vs documents)

## Benefits

✅ **Explicit and discoverable** - Table config visible in component props
✅ **No magic** - No URL parsing or hidden extraction logic
✅ **Flexible** - Each widget can query different tables
✅ **Backend alignment** - Matches backend API structure exactly
✅ **Future-proof** - Reserved API surface for multi-table queries (backend ready)
✅ **Type-safe** - Table names in TypeScript props
✅ **Simpler code** - No backward compatibility complexity
✅ **Auto-inheritance** - RAGResults inherits from AnswerBox automatically
✅ **Clean architecture** - Each query specifies its own table
✅ **Enables multi-table RAG** - Foundation for heterogeneous search across tables

## Trade-offs

⚠️ **Breaking change** - Existing code (if any) will break
⚠️ **Slightly verbose** - Single-table apps must specify table explicitly
⚠️ **Listener refactoring** - Needs table-aware query grouping logic

## Testing Strategy

1. **Unit tests**:
   - Test table resolution logic (widget override vs default)
   - Test RAGResults auto-inheritance from AnswerBox
   - Test error handling for missing tables

2. **Integration tests**:
   - Multi-widget, single-table scenarios
   - Multi-widget, multi-table scenarios
   - Listener table grouping and per-table query execution

3. **Storybook stories**:
   - Single table with multiple widgets
   - Multiple tables with widget overrides
   - RAGResults auto-inheritance examples
   - Error state examples

## Implementation Summary (Completed)

### Approach Used: **Option 3** (Hybrid)
Implemented Phase 1 with multi-table support in mind:
- Type system supports `string | string[]` internally
- Helper functions handle both single and array formats
- UI currently exposes only single table (Phase 1)
- Phase 2 will be trivial to implement (just enable array in UI)

### Files Modified

1. ✅ `src/SharedContext.tsx` - Added table fields to Widget and SharedState
2. ✅ `src/Antfly.tsx` - Added required `table` prop
3. ✅ `src/SearchBox.tsx` - Added optional `table` prop
4. ✅ `src/AnswerBox.tsx` - Added optional `table` prop
5. ✅ `src/Results.tsx` - Added optional `table` prop
6. ✅ `src/RAGResults.tsx` - Added `table` prop with auto-inheritance from AnswerBox
7. ✅ `src/Facet.tsx` - Added optional `table` prop
8. ✅ `src/Autosuggest.tsx` - Added optional `table` prop
9. ✅ `src/Listener.tsx` - Uses `resolveTable()` helper, adds table to each query
10. ✅ `src/utils.ts` - Added table helpers, updated streamRAG signature
11. ✅ `stories/*.stories.tsx` - Updated all 10 story files with new API
12. ✅ `stories/utils.js` - Changed URL format, added `tableName` export
13. ✅ `src/RAGResults.test.tsx` - Fixed all test mocks for new streamRAG signature

### New Utility Functions

**src/utils.ts**:
- `normalizeTable(table?: string | string[])` - Converts to array format
- `resolveTable(widgetTable, defaultTable)` - Resolves table priority (widget > default)

## Resolved Design Decisions

1. ✅ **RAGResults inheritance**: Auto-inherit from AnswerBox, allow optional override
2. ✅ **Table priority**: Simple two-level - `widget.table > Antfly.table`
3. ✅ **URL format**: Clean base URL only, no `/table/{name}` suffix
4. ✅ **Backward compatibility**: None - clean break for simplest implementation (aligns with backend breaking change)
5. ✅ **Error handling**: Widget-level error state in `widget.result.error`
6. ✅ **Multi-table**: Reserve `tables?: string[]` API but don't implement yet (backend ready)
7. ✅ **SDK integration**: Table passed via `QueryRequest.table` field, not as separate parameter
8. ✅ **Listener simplification**: No need to group by table - each query has its own table field
9. ✅ **Backend alignment**: Frontend API matches backend structure (queries with explicit tables)
10. ✅ **RAG API change**: Backend now uses `queries[]` instead of `query` (breaking change 2025-10-25)

## Breaking Changes in Phase 1

### Before
```tsx
<Antfly url="http://localhost:8080/api/v1/table/example">
  <SearchBox id="search" fields={["name"]} />
</Antfly>
```

### After
```tsx
<Antfly url="http://localhost:8080/api/v1" table="example">
  <SearchBox id="search" fields={["name"]} />
</Antfly>
```

### Migration Guide
1. Split URL: Remove `/table/{name}` suffix from URL
2. Add `table` prop to `<Antfly>` component
3. Optional: Add `table` prop to individual widgets for multi-table scenarios

### Test Results
- **184/184 tests passing** ✅
- All RAGResults streaming tests updated and passing
- All integration tests passing
- All widget component tests passing

## Next Steps (Phase 2)

Ready to implement multi-table support when needed:

1. **Enable array support in UI**:
   - Change widget props from `table?: string` to `table?: string | string[]`
   - Update `resolveTable()` to return array when needed
   - Handle multiple queries per widget in Listener

2. **Multi-table RAG UI**:
   - Add `renderTableResult` prop to RAGResults
   - Handle `table_result` SSE events
   - Implement per-table rendering

3. **Update examples**:
   - Add multi-table Storybook stories
   - Document multi-table patterns in README

## Open Questions (Phase 2)

### Multi-Table RAG (Backend Ready)
1. How should `table_result` SSE events be handled in RAGResults component?
2. Should we provide table-specific render props for heterogeneous data (images vs products vs docs)?
3. How should we handle partial failures (some tables succeed, others fail)?
4. Should we provide a `MultiTableRAGResults` component or extend `RAGResults`?

### General
5. Should we provide validation hooks for table existence?
6. Should we provide TypeScript types for table names (string literal unions)?
7. Should we expose `document_renderer` prop (per-query template for RAG)?

**Backend context**: See `/Users/ajroetker/go/src/github.com/antflydb/antfly/work-log/003-multi-table-rag/plan.md` for multi-table RAG implementation details.
