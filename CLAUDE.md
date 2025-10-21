# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React Antfly (`@antfly/components`) is a React component library for building search interfaces with Antfly. It provides declarative components for search boxes, facets, results, pagination, and query building. The library is unstyled by design, allowing developers full control over presentation.

## Build and Development Commands

```bash
# Run tests
npm test

# Run tests in watch mode
vitest

# Build the library
npm run build

# Type checking
npm run typecheck

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Storybook (component development and examples)
npm run storybook

# Build storybook
npm run build-storybook
```

## Testing

- Uses Vitest with jsdom for testing React components
- Tests are located alongside component files (e.g., `SearchBox.test.tsx`)
- Test setup is in `vitest.setup.ts`
- Run specific test file: `vitest src/SearchBox.test.tsx`
- Run tests with UI: `npm run vitest`

## Architecture

### State Management

The library uses a **centralized state system** via React Context:

- **`SharedContext.tsx`**: Defines the state shape and actions
- **`SharedContextProvider.tsx`**: Provides the context to components
- **`Antfly.tsx`**: Root component that initializes the context with a reducer

All components (SearchBox, Facet, Results, etc.) register themselves as **widgets** in the shared state. The `Listener` component coordinates queries by:
1. Collecting widget configurations
2. Building queries from widget state
3. Executing multi-query requests via `msearch()`
4. Distributing results back to widgets

### Widget System

Each interactive component is a "widget" that registers in `SharedState.widgets` Map with:
- `id`: Unique identifier
- `needsQuery`: Whether it needs query results
- `needsConfiguration`: Whether it contributes to the query
- `isFacet`: Whether it's a facet component
- `wantResults`: Whether it wants full results
- `query`: The query it contributes
- `value`: Current selected/input value
- `configuration`: Component config (fields, size, etc.)
- `result`: Query results specific to this widget

### Query Building

Queries are constructed from widget states using helper functions in `utils.ts`:
- `conjunctsFrom()`: Combines multiple queries with AND logic
- `disjunctsFrom()`: Combines queries with OR logic
- `toTermQueries()`: Creates term queries for facet selections

The library uses Antfly's query DSL (match, conjuncts, disjuncts) and communicates via the TypeScript SDK (`@antfly/sdk`).

### URL State Synchronization

- `toUrlQueryString()`: Serializes widget state to URL query params
- `fromUrlQueryString()`: Deserializes URL params back to state
- Supports browser back/forward navigation

## Key Components

- **Antfly**: Root provider component that initializes client and context
- **SearchBox**: Text search input with debouncing
- **Autosuggest**: Search box with autocomplete suggestions
- **Facet**: Faceted navigation with term aggregations
- **Results**: Render search results with customizable item rendering
- **Pagination**: Page navigation controls
- **QueryBuilder**: Advanced query building UI with rules and combinators
- **ActiveFilters**: Display and remove active filters
- **Listener**: Internal component that coordinates queries (not typically used directly)
- **CustomWidget**: Extensibility point for custom search widgets

## SDK Integration

The library depends on `@antfly/sdk` (from `antfly-ts` repository) which provides:
- `AntflyClient`: HTTP client for Antfly API
- Type definitions for queries and responses
- Multi-query support via `multiquery()`

Client initialization happens in `Antfly` component via `initializeAntflyClient()`. The client is stored as a singleton accessible via `getAntflyClient()`.

## Build Output

The library is built as both ES modules and UMD:
- `dist/main.js`: ES module format
- `dist/main.umd.cjs`: UMD format for legacy usage
- `types/`: TypeScript declaration files

React, React DOM, and react/jsx-runtime are peer dependencies (not bundled).

## Publishing

Published to npm as `@antfly/components`. The package includes:
- Main entry: `dist/main.js`
- Types entry: `types/index.d.ts`
- Source maps for debugging

## Component Development Workflow

1. Create component in `src/` with corresponding `.test.tsx` file
2. Add component to `src/index.ts` exports
3. Create story in `stories/` for documentation
4. Run `npm run storybook` to develop interactively
5. Run tests with `npm test`
6. Lint and type-check before committing
