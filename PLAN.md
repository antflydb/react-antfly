# Plan: Add Custom Query Support to Autosuggest

## Current Behavior

The `Autosuggest` component currently has limitations in how it queries data:

1. **Client-side filtering only**: The component registers itself as a facet widget (`isFacet: true`) and passes `filterValue: searchValue` (Autosuggest.tsx:52-56)

2. **Fetches all facet terms**: The `Listener` component builds facet queries that fetch ALL facet terms for the specified fields, regardless of the search value

3. **Inefficient filtering**: The `filterValue` is only used for **client-side filtering** (Listener.tsx:171-172), which filters returned facet terms using `toLowerCase().includes()`

4. **No server-side query customization**: Unlike `SearchBox` which supports `customQuery` for flexible query construction, `Autosuggest` cannot customize how queries are sent to the server

### Problem

This approach is inefficient for large datasets because:
- All facet terms are fetched from the server
- Filtering happens client-side after data is returned
- No ability to use server-side query types like `prefix`, `fuzzy`, `match_phrase`, etc.
- Network overhead from fetching unnecessary data

## Proposed Solution

Add `customQuery` support to `Autosuggest`, similar to how `SearchBox` works, allowing developers to customize the query type sent to the server.

### Changes Required

#### 1. Extend AutosuggestProps Interface

**File**: `src/Autosuggest.tsx`

Add optional `customQuery` prop:

```typescript
export interface AutosuggestProps {
  fields: string[];
  limit?: number;
  minChars?: number;
  renderSuggestion?: (suggestion: string, count?: number) => ReactNode;
  customQuery?: (value: string, fields: string[]) => unknown;  // NEW
  // Internal props passed from SearchBox
  searchValue?: string;
  onSuggestionSelect?: (value: string) => void;
}
```

#### 2. Modify Autosuggest Component

**File**: `src/Autosuggest.tsx`

Update the widget dispatch to support custom queries:

```typescript
export default function Autosuggest({
  fields,
  limit = 10,
  minChars = 2,
  renderSuggestion,
  customQuery,  // NEW
  searchValue = "",
  onSuggestionSelect,
}: AutosuggestProps) {
  // ... existing code ...

  useEffect(() => {
    const shouldShow = searchValue.length >= minChars;
    setIsOpen(shouldShow);
    setSelectedIndex(-1);

    if (shouldShow) {
      // Register widget to fetch facet suggestions
      dispatch({
        type: "setWidget",
        key: id,
        needsQuery: customQuery ? true : false,  // CHANGED: need query if custom
        needsConfiguration: true,
        isFacet: true,
        wantResults: false,
        query: customQuery ? customQuery(searchValue, fields) : undefined,  // NEW
        configuration: {
          fields,
          size: limit,
          filterValue: customQuery ? undefined : searchValue,  // Only use filterValue for legacy mode
          useCustomQuery: !!customQuery,  // NEW: flag for Listener
        },
        result: undefined,
      });
    } else {
      // ... existing clear code ...
    }
  }, [searchValue, fields, limit, minChars, customQuery, dispatch, id]);  // Added customQuery to deps
```

#### 3. Update SharedContextProvider Types

**File**: `src/SharedContextProvider.tsx`

Update the `Widget` interface to support the new configuration:

```typescript
export interface Widget {
  needsQuery?: boolean;
  needsConfiguration?: boolean;
  isFacet?: boolean;
  isSemantic?: boolean;
  wantResults?: boolean;
  query?: unknown;
  semanticQuery?: string;
  value?: unknown;
  configuration?: {
    fields?: string[];
    size?: number;
    filterValue?: string;
    useCustomQuery?: boolean;  // NEW
    // ... other existing fields ...
  };
  result?: {
    data: unknown;
    total: number;
    error?: string;
  };
}
```

#### 4. Update Listener Component

**File**: `src/Listener.tsx`

Modify the facet query building logic to support custom queries:

```typescript
// Around line 114, in the facetWidgets.forEach block:

facetWidgets.forEach((f, id) => {
  const config = f.configuration as any;
  const fields = config.fields;
  const size = config.size;
  const filterValue = config.filterValue;
  const useCustomQuery = config.useCustomQuery;  // NEW

  // Get the aggs (antfly queries) from fields
  function aggsFromFields() {
    // Remove current query from queries list (do not react to self)
    function withoutOwnQueries() {
      const q = new Map(queries);
      q.delete(id);
      return q;
    }

    // Transform a single field to agg query
    function aggFromField(field: string) {
      const t = { field, size };
      return { [field]: t };
    }

    // Actually build the query from fields
    let result = {};
    fields.forEach((f: string) => {
      result = { ...result, ...aggFromField(f) };
    });

    // Join semanticQueries as a string
    const semanticQuery = Array.from(semanticQueries.values())
      .map((v) => v.query)
      .join(" ");

    // Get the first indexes configured for the widget
    const indexes = Array.from(semanticQueries.values())
      .map((v) => v.indexes)
      .filter((i) => i && Array.isArray(i) && i.length > 0)[0];
    const limit = Array.from(semanticQueries.values()).map((v) => v.limit)[0] || 10;

    // NEW: Build query with custom query support
    const baseQueries = withoutOwnQueries();
    const fullTextQuery = useCustomQuery && f.query
      ? queryFrom(new Map([...baseQueries, [id, f.query]]))  // Include custom query
      : queryFrom(baseQueries);  // Legacy mode

    return {
      semantic_search: semanticQuery,
      indexes: semanticQuery ? indexes : undefined,
      limit: semanticQuery ? limit : 0,
      full_text_search: fullTextQuery,
      facets: result,
    };
  }

  multiqueryData.push({
    query: aggsFromFields(),
    data: (result: any) => {
      // Merge aggs (if there is more than one for a facet),
      // then remove duplicate and add doc_count (sum),
      // then sort and slice to get only 10 first.
      const map = new Map();
      fields
        .map((f: string) => {
          if (!result.facets || !result.facets[f] || !result.facets[f].terms) {
            return [];
          }
          // NEW: Only use filterValue for legacy mode (non-custom queries)
          if (filterValue && !useCustomQuery) {  // CHANGED: check useCustomQuery
            return result.facets[f].terms.filter((i: any) =>
              i.term.toLowerCase().includes(filterValue.toLowerCase()),
            );
          }
          return result.facets[f].terms;
        })
        .reduce((a: any[], b: any[]) => a.concat(b))
        .forEach((i: any) => {
          map.set(i.term, {
            key: i.term,
            doc_count: map.has(i.term) ? i.count + map.get(i.term).doc_count : i.count,
          });
        });
      return [...map.values()]
        .sort((x: any, y: any) => y.doc_count - x.doc_count)
        .slice(0, size);
    },
    total: (result: any) => result.hits.total,
    id: id,
  });
});
```

## Usage Examples

### Example 1: Default Behavior (Backward Compatible)

```tsx
<Autosuggest
  fields={["title._2gram"]}
  limit={10}
  minChars={1}
/>
```

This continues to work as before using client-side filtering.

### Example 2: Prefix Query

```tsx
<Autosuggest
  fields={["title._2gram", "title.keyword"]}
  limit={10}
  minChars={1}
  customQuery={(value, fields) => ({
    disjuncts: fields.map(field => ({
      prefix: value,
      field: field
    }))
  })}
/>
```

### Example 3: Fuzzy Query

```tsx
<Autosuggest
  fields={["title"]}
  limit={10}
  minChars={2}
  customQuery={(value, fields) => ({
    disjuncts: fields.map(field => ({
      match: value,
      field: field,
      fuzziness: 1
    }))
  })}
/>
```

### Example 4: Match Phrase Prefix

```tsx
<Autosuggest
  fields={["title"]}
  limit={10}
  minChars={2}
  customQuery={(value, fields) => ({
    disjuncts: fields.map(field => ({
      match_phrase_prefix: value,
      field: field
    }))
  })}
/>
```

### Example 5: Combined Query Types

```tsx
<Autosuggest
  fields={["title._2gram", "title.keyword", "title"]}
  limit={10}
  minChars={1}
  customQuery={(value, fields) => ({
    disjuncts: [
      { prefix: value, field: "title.keyword" },  // Exact prefix match
      { match: value, field: "title._2gram" },    // 2gram match
      { match: value, field: "title", fuzziness: 1 }  // Fuzzy match
    ]
  })}
/>
```

## Benefits

1. **Server-side filtering**: Queries are processed on the server, reducing data transfer
2. **Flexible query types**: Support for `prefix`, `fuzzy`, `match_phrase`, `wildcard`, etc.
3. **Better performance**: Especially for large datasets
4. **Backward compatible**: Existing code continues to work without changes
5. **Consistent API**: Matches the `SearchBox` `customQuery` pattern

## Testing Strategy

1. **Unit tests**: Test `customQuery` prop with various query types
2. **Integration tests**: Verify server queries are constructed correctly
3. **Backward compatibility tests**: Ensure existing `Autosuggest` usage still works
4. **Performance tests**: Compare client-side vs server-side filtering performance

## Migration Guide

### For existing users (no changes required)

Existing code continues to work without modifications:

```tsx
<Autosuggest fields={["title"]} limit={10} />
```

### For users wanting custom queries

Add the `customQuery` prop:

```tsx
<Autosuggest
  fields={["title"]}
  limit={10}
  customQuery={(value, fields) => ({
    disjuncts: fields.map(field => ({ prefix: value, field }))
  })}
/>
```

## Future Enhancements

1. **Predefined query types**: Add convenience props like `queryType="prefix"` for common cases
2. **Query boosting**: Support field-level boosting in suggestions
3. **Highlighting**: Add support for highlighting matched terms in suggestions
4. **Caching**: Add client-side caching for repeated queries