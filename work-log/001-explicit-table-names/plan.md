# Explicit Table Names in Component Configuration

## Problem Statement

Currently, the component library infers table names from URL paths (e.g., `/table/{tableName}/query`). However:
- `QueryRequest` and `RAGRequest` both include a `table` field in their structure
- We want to eventually support multi-table queries
- Table configuration should be explicit in component props for clarity and flexibility

## Current Architecture

1. **Root Component**: `<Antfly url="http://localhost:8080/api/v1/table/example" />`
2. **URL Parsing**: `streamRAG()` extracts table name from URL (utils.ts:153)
3. **Listener**: Uses `multiquery()` without table specification (Listener.tsx:324)
4. **Widgets**: No table configuration currently

## Design Decision: Clean Break (No Users)

Since we have no users currently, we can make breaking changes for the cleanest design:
- ❌ No backward compatibility needed
- ❌ No URL parsing/extraction
- ✅ Explicit table configuration required
- ✅ Simplest possible implementation

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

```typescript
// Reserve API surface but don't implement yet
<SearchBox
  id="cross-search"
  tables={["products", "reviews", "articles"]}  // Future feature
  fields={["title", "content"]}
/>
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

**Listener.tsx** - Refactor to group by table and execute per-table queries:

```typescript
// Inside the fetchData function:

// Group widgets by table
const widgetsByTable = new Map<string, MSSearchItem[]>();

// Process result widgets
resultWidgets.forEach((r, id) => {
  const tableName = r.table || table;  // Use widget table or default
  if (!widgetsByTable.has(tableName)) {
    widgetsByTable.set(tableName, []);
  }

  // Build query item (same logic as before)
  const queryItem = { /* ... */ };
  widgetsByTable.get(tableName)!.push(queryItem);
});

// Process facet widgets similarly
facetWidgets.forEach((f, id) => {
  const tableName = f.table || table;
  // ... same grouping logic
});

// Execute multiquery per table
for (const [tableName, multiqueryData] of widgetsByTable.entries()) {
  const result = await multiquery(url, tableName, multiqueryData, headers);

  // Process results for this table's widgets
  // ... existing result processing logic
}
```

### 5. Update Utilities

**utils.ts**:

Update `multiquery()` signature:
```typescript
export async function multiquery(
  url: string,
  tableName: string,              // Explicit table parameter
  msearchData: MultiqueryRequest[],
  headers: Record<string, string> = {},
): Promise<QueryResponses | undefined> {
  try {
    let client = defaultClient;
    if (!client) {
      client = initializeAntflyClient(url, headers);
    }

    const queries = msearchData.map((item) => item.query);
    const result = await client.tables.multiquery(tableName, queries);  // Use table-specific endpoint
    return result;
  } catch (error) {
    // ... error handling
  }
}
```

Update `streamRAG()` - **Remove URL parsing logic**:
```typescript
export async function streamRAG(
  url: string,
  tableName: string,              // Explicit table parameter (required)
  request: RAGRequest,
  headers: Record<string, string> = {},
  callbacks: RAGCallbacks,
): Promise<AbortController> {
  // Remove: const tableMatch = url.match(/\/table\/([^/]+)/);
  // Remove: const baseUrl = tableName ? url.replace(...) : url;

  const client = new AntflyClient({ baseUrl: url, headers });

  // Use explicit tableName parameter
  const result = await client.tables.rag(tableName, ragRequest, sdkCallbacks);

  // ... rest of implementation
}
```

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

const controller = await streamRAG(
  url,
  tableName,  // Pass resolved table name
  ragRequest,
  headers || {},
  callbacks
);
```

**Key feature**: RAGResults automatically inherits the table from the AnswerBox it's connected to, but can be overridden if needed.

## Migration Path

### Phase 1: Clean Breaking Change (Current Work)
- **BREAKING**: Make `table` required on Antfly component
- **BREAKING**: Remove all URL parsing/extraction logic
- Add optional `table` override prop to all widget components
- Update Listener to group by table and execute per-table queries
- RAGResults auto-inherits table from AnswerBox
- Update all examples and documentation

### Phase 2: Multi-Table Support (Future)
- Add `tables?: string[]` to widget props
- Update Listener to handle cross-table queries
- Implement table-specific result aggregation and merging
- Design UI patterns for multi-table result display

## Benefits

✅ **Explicit and discoverable** - Table config visible in component props
✅ **No magic** - No URL parsing or hidden extraction logic
✅ **Flexible** - Each widget can query different tables
✅ **Future-proof** - Reserved API surface for multi-table queries
✅ **Type-safe** - Table names in TypeScript props
✅ **Simpler code** - No backward compatibility complexity
✅ **Auto-inheritance** - RAGResults inherits from AnswerBox automatically
✅ **Clean architecture** - Listener groups by table cleanly

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

## Files to Modify

1. `src/SharedContext.tsx` - Add table fields to Widget and SharedState
2. `src/Antfly.tsx` - Add defaultTable prop, extract from URL
3. `src/SearchBox.tsx` - Add table prop
4. `src/AnswerBox.tsx` - Add table prop
5. `src/Results.tsx` - Add table prop
6. `src/RAGResults.tsx` - Add table prop, update streamRAG call
7. `src/Facet.tsx` - Add table prop
8. `src/Autosuggest.tsx` - Add table prop
9. `src/Listener.tsx` - Group by table, execute per-table multiquery
10. `src/utils.ts` - Update multiquery and streamRAG signatures
11. `stories/*.stories.tsx` - Update examples with table props
12. `README.md` - Document new API

## Resolved Design Decisions

1. ✅ **RAGResults inheritance**: Auto-inherit from AnswerBox, allow optional override
2. ✅ **Table priority**: Simple two-level - `widget.table > Antfly.table`
3. ✅ **URL format**: Clean base URL only, no `/table/{name}` suffix
4. ✅ **Backward compatibility**: None - clean break for simplest implementation
5. ✅ **Error handling**: Widget-level error state in `widget.result.error`
6. ✅ **Multi-table**: Reserve `tables?: string[]` API but don't implement yet

## Open Questions (Future Work)

1. For multi-table queries, how should results be merged/displayed?
2. Should we provide validation hooks for table existence?
3. Should we provide TypeScript types for table names (string literal unions)?
