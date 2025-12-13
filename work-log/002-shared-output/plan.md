# Shared Output Container for Autosuggest and Results

**Status**: Planning
**Created**: 2025-12-12

## Goal

Create a `SharedOutputContainer` component that allows Autosuggest and Results/RAGResults/AnswerResults to share a common output space, supporting both:
1. **Dropdown mode**: Output appears below the search input (inline)
2. **Modal mode**: Output appears as a centered Cmd+K style overlay (portal)

## Context

Currently, each component renders independently:
- `Autosuggest` renders an absolutely positioned dropdown below the input
- `Results`, `RAGResults`, `AnswerResults` render inline in the document flow

For search experiences like Cmd+K (Spotlight-style), we need both autosuggest and results to share a single container that can work as either a dropdown or a modal.

## Design Decision

**Single component with `portal` prop** - the simplest approach that handles both modes:

```tsx
<SharedOutputContainer
  isOpen={isOpen}
  onClose={close}
  anchorRef={containerRef}
  portal={false}  // dropdown mode (default)
>
  {content}
</SharedOutputContainer>

<SharedOutputContainer
  isOpen={isOpen}
  onClose={close}
  portal={true}  // modal mode
>
  {content}
</SharedOutputContainer>
```

The container handles:
- Open/close state
- Click-outside detection
- Escape key handling
- Portal rendering (when `portal={true}`)
- CSS positioning (dropdown vs modal)

The content is identical in both modes - only the container behavior changes.

## API Design

### SharedOutputContainer

```typescript
interface SharedOutputContainerProps {
  /** Whether the container is visible */
  isOpen: boolean

  /** Callback when container should close (click outside, Escape key) */
  onClose: () => void

  /** Ref to the anchor element for dropdown positioning (dropdown mode only) */
  anchorRef?: React.RefObject<HTMLElement | null>

  /** Render as portal to document.body (modal mode) */
  portal?: boolean

  /** Additional class name for the container */
  className?: string

  /** Additional class name for the content wrapper */
  contentClassName?: string

  /** Content to render inside the container */
  children: ReactNode
}
```

### SearchOutputContent (Optional Helper)

A convenience component for the common pattern of showing autosuggest OR results:

```typescript
interface SearchOutputContentProps {
  /** Show autosuggest suggestions */
  showAutosuggest?: boolean

  /** Show results (after submission) */
  showResults?: boolean

  /** Autosuggest configuration */
  autosuggestProps?: Partial<AutosuggestProps>

  /** Results configuration - which type to show */
  resultsType?: 'basic' | 'rag' | 'answer'

  /** Props for the results component */
  resultsProps?: Partial<ResultsProps | RAGResultsProps | AnswerResultsProps>

  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (hit: QueryHit) => void
}
```

## Implementation Plan

### Phase 1: SharedOutputContainer Component

**File**: `src/SharedOutputContainer.tsx`

```typescript
import { createPortal } from 'react-dom'
import { useEffect, useRef, type ReactNode } from 'react'

export interface SharedOutputContainerProps {
  isOpen: boolean
  onClose: () => void
  anchorRef?: React.RefObject<HTMLElement | null>
  portal?: boolean
  className?: string
  contentClassName?: string
  children: ReactNode
}

export function SharedOutputContainer({
  isOpen,
  onClose,
  anchorRef,
  portal = false,
  className,
  contentClassName,
  children,
}: SharedOutputContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node

      // Check if click is outside container
      const clickedOutsideContainer =
        containerRef.current && !containerRef.current.contains(target)

      // Check if click is outside anchor (for dropdown mode)
      const clickedOutsideAnchor =
        !anchorRef?.current || !anchorRef.current.contains(target)

      if (clickedOutsideContainer && clickedOutsideAnchor) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, anchorRef])

  if (!isOpen) return null

  // Modal mode: render via portal with overlay
  if (portal) {
    return createPortal(
      <div
        className={`react-af-output-modal-overlay ${className || ''}`}
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          ref={containerRef}
          className={`react-af-output-modal-content ${contentClassName || ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>,
      document.body
    )
  }

  // Dropdown mode: render in place
  return (
    <div
      ref={containerRef}
      className={`react-af-output-dropdown ${className || ''}`}
    >
      <div className={`react-af-output-dropdown-content ${contentClassName || ''}`}>
        {children}
      </div>
    </div>
  )
}

export default SharedOutputContainer
```

### Phase 2: CSS Styles

**File**: `src/style.css` (additions)

```css
/* SharedOutputContainer - Dropdown mode */
.react-af-output-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 70vh;
  overflow-y: auto;
  z-index: 1000;
}

.react-af-output-dropdown-content {
  padding: 0;
}

/* SharedOutputContainer - Modal mode */
.react-af-output-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  z-index: 9999;
}

.react-af-output-modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 640px;
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Modal input area */
.react-af-output-modal-input {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.react-af-output-modal-input input {
  width: 100%;
  font-size: 18px;
  border: none;
  outline: none;
  background: transparent;
}

/* Shared content area */
.react-af-output-content {
  flex: 1;
  overflow-y: auto;
}

.react-af-output-section {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.react-af-output-section:last-child {
  border-bottom: none;
}

/* Loading state */
.react-af-output-loading {
  padding: 24px;
  text-align: center;
  color: #666;
}

/* Empty state */
.react-af-output-empty {
  padding: 24px;
  text-align: center;
  color: #999;
}
```

### Phase 3: Export from Index

**File**: `src/index.ts` (additions)

```typescript
export { SharedOutputContainer } from './SharedOutputContainer'
export type { SharedOutputContainerProps } from './SharedOutputContainer'
```

### Phase 4: Tests

**File**: `src/SharedOutputContainer.test.tsx`

Test cases:
- Renders children when `isOpen={true}`
- Does not render when `isOpen={false}`
- Calls `onClose` when Escape key pressed
- Calls `onClose` when clicking outside (dropdown mode)
- Calls `onClose` when clicking overlay (modal mode)
- Does not close when clicking inside content
- Renders via portal when `portal={true}`
- Renders inline when `portal={false}`
- Applies custom className
- Applies custom contentClassName

### Phase 5: Storybook Stories

**File**: `stories/shared-output.stories.tsx`

Stories:
1. **Dropdown with Autosuggest**: Basic dropdown showing autosuggest results
2. **Dropdown with Results**: Dropdown showing search results after submission
3. **Dropdown with Transition**: Autosuggest → Results on submit
4. **Modal Basic**: Cmd+K style modal with input and results
5. **Modal with RAGResults**: Modal showing streaming AI answers
6. **Modal with AnswerResults**: Modal showing Answer Agent responses

## Usage Examples

### Example 1: Inline Dropdown Search

```tsx
function InlineSearch() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  return (
    <Antfly url="http://localhost:8080/api/v1" table="documents">
      <div ref={containerRef} style={{ position: 'relative' }}>
        <QueryBox
          id="search"
          onFocus={() => setIsOpen(true)}
          onSubmit={() => setHasSubmitted(true)}
        >
          <input placeholder="Search..." />
        </QueryBox>

        <SharedOutputContainer
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false)
            setHasSubmitted(false)
          }}
          anchorRef={containerRef}
        >
          {!hasSubmitted ? (
            <Autosuggest fields={['title', 'content']}>
              <AutosuggestResults />
            </Autosuggest>
          ) : (
            <RAGResults
              id="rag"
              searchBoxId="search"
              summarizer={{ provider: 'ollama', model: 'gemma3:4b' }}
            />
          )}
        </SharedOutputContainer>
      </div>
    </Antfly>
  )
}
```

### Example 2: Cmd+K Modal

```tsx
function CmdKSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setHasSubmitted(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <Antfly url="http://localhost:8080/api/v1" table="documents">
      {/* Trigger button for non-keyboard users */}
      <button onClick={() => setIsOpen(true)}>
        Search (Cmd+K)
      </button>

      <SharedOutputContainer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        portal
      >
        {/* Input inside modal */}
        <div className="react-af-output-modal-input">
          <QueryBox
            id="cmdk-search"
            onSubmit={() => setHasSubmitted(true)}
          >
            <input placeholder="Search documentation..." autoFocus />
          </QueryBox>
        </div>

        {/* Content area */}
        <div className="react-af-output-content">
          {!hasSubmitted ? (
            <Autosuggest
              fields={['title', 'content']}
              onSuggestionSelect={() => setIsOpen(false)}
            >
              <AutosuggestResults />
            </Autosuggest>
          ) : (
            <AnswerResults
              id="answer"
              searchBoxId="cmdk-search"
              generator={{ provider: 'openai', model: 'gpt-4o' }}
              showReasoning
              showConfidence
            />
          )}
        </div>
      </SharedOutputContainer>
    </Antfly>
  )
}
```

### Example 3: Tabbed Output (Autosuggest + Results Side by Side)

```tsx
function TabbedSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'suggestions' | 'results'>('suggestions')

  return (
    <Antfly url="http://localhost:8080/api/v1" table="docs">
      <SharedOutputContainer isOpen={isOpen} onClose={() => setIsOpen(false)} portal>
        <div className="react-af-output-modal-input">
          <QueryBox id="search" onSubmit={() => setActiveTab('results')}>
            <input placeholder="Search..." autoFocus />
          </QueryBox>
        </div>

        {/* Tab navigation */}
        <div className="tabs">
          <button
            className={activeTab === 'suggestions' ? 'active' : ''}
            onClick={() => setActiveTab('suggestions')}
          >
            Suggestions
          </button>
          <button
            className={activeTab === 'results' ? 'active' : ''}
            onClick={() => setActiveTab('results')}
          >
            Results
          </button>
        </div>

        <div className="react-af-output-content">
          {activeTab === 'suggestions' && (
            <Autosuggest fields={['title']}>
              <AutosuggestResults />
            </Autosuggest>
          )}
          {activeTab === 'results' && (
            <Results
              id="results"
              searchBoxId="search"
              items={(hits) => (
                <ul>
                  {hits.map(hit => (
                    <li key={hit._id}>{hit._source?.title}</li>
                  ))}
                </ul>
              )}
            />
          )}
        </div>
      </SharedOutputContainer>
    </Antfly>
  )
}
```

## Technical Considerations

### Focus Management

For modal mode, we should:
- Auto-focus the input when modal opens
- Trap focus within the modal (Tab cycles through modal elements)
- Return focus to trigger element on close

Implementation:
```typescript
// In SharedOutputContainer, when portal mode:
useEffect(() => {
  if (isOpen && portal) {
    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement

    // Focus first focusable element in modal
    const firstFocusable = containerRef.current?.querySelector<HTMLElement>(
      'input, button, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()

    return () => {
      // Restore focus on close
      previouslyFocused?.focus()
    }
  }
}, [isOpen, portal])
```

### Accessibility

Required ARIA attributes:
- `role="dialog"` on modal
- `aria-modal="true"` on modal
- `aria-labelledby` pointing to heading (if present)
- `aria-describedby` for description (if present)

### Animation (Optional, Phase 2)

Could add CSS transitions for open/close:
```css
.react-af-output-modal-overlay {
  opacity: 0;
  transition: opacity 0.2s ease-out;
}

.react-af-output-modal-overlay.entering,
.react-af-output-modal-overlay.entered {
  opacity: 1;
}

.react-af-output-modal-content {
  transform: scale(0.95) translateY(-10px);
  transition: transform 0.2s ease-out;
}

.react-af-output-modal-overlay.entered .react-af-output-modal-content {
  transform: scale(1) translateY(0);
}
```

### Body Scroll Lock (Modal Mode)

When modal is open, prevent body scroll:
```typescript
useEffect(() => {
  if (isOpen && portal) {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }
}, [isOpen, portal])
```

## Migration from Current Autosuggest

The existing `Autosuggest` component has its own dropdown logic. Users can:

1. **Keep using Autosuggest as-is** for simple autocomplete
2. **Use SharedOutputContainer** for combined autosuggest + results

No breaking changes to existing Autosuggest API.

## Files to Create/Modify

### New Files
- `src/SharedOutputContainer.tsx` - Main component
- `src/SharedOutputContainer.test.tsx` - Tests
- `stories/shared-output.stories.tsx` - Storybook stories

### Modified Files
- `src/style.css` - Add new CSS classes
- `src/index.ts` - Export new component

## Testing Strategy

1. **Unit Tests** (SharedOutputContainer.test.tsx):
   - Open/close state handling
   - Escape key closes container
   - Click outside closes container (both modes)
   - Portal rendering
   - Inline rendering
   - Focus management

2. **Integration Tests**:
   - Autosuggest inside SharedOutputContainer
   - Results inside SharedOutputContainer
   - Mode switching (autosuggest → results)
   - Nested in QueryBox

3. **Visual Tests** (Storybook):
   - Dropdown positioning
   - Modal overlay
   - Responsive behavior
   - Dark mode (if supported)

## Success Criteria

- [ ] SharedOutputContainer renders in dropdown mode
- [ ] SharedOutputContainer renders in modal mode via portal
- [ ] Escape key closes container
- [ ] Click outside closes container
- [ ] Autosuggest works inside container
- [ ] Results/RAGResults/AnswerResults work inside container
- [ ] CSS styling matches existing component aesthetics
- [ ] All tests pass
- [ ] Storybook stories demonstrate both modes
- [ ] No breaking changes to existing components

## Future Enhancements (Not in Scope)

- Animation library integration (framer-motion, react-spring)
- Multiple container instances
- Nested modals
- Custom positioning strategies
- Mobile-specific behavior (bottom sheet)

## Open Questions

1. **Should we provide a `useCmdK` hook for the keyboard shortcut?**
   - Leaning no - let users implement their own shortcut handling

2. **Should modal auto-focus the input?**
   - Leaning yes - standard modal behavior

3. **Should we add a built-in loading indicator?**
   - Leaning no - let content components handle their own loading states

4. **Should dropdown mode use a portal too (to escape overflow: hidden)?**
   - Could add `portalDropdown` prop for this case, but keep simple for now
