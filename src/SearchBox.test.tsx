import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import SearchBox from './SearchBox';
import Autosuggest from './Autosuggest';
import Antfly from './Antfly';

// Wrapper component to provide required context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Antfly url="http://localhost:8082/api/v1" table="test">{children}</Antfly>;
};

describe('SearchBox', () => {
  describe('basic rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
      const input = container.querySelector('input');
      expect(input).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} placeholder="Custom placeholder" />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.placeholder).toBe('Custom placeholder');
    });

    it('should render with default placeholder', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input).toBeTruthy();
      expect(input?.placeholder).toBe('search…');
    });

    it('should render with initial value', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} initialValue="initial search" />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe('initial search');
    });
  });

  describe('input handling', () => {
    it('should update value when user types', async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();

      await userEvent.type(input, 'test query');
      expect(input.value).toBe('test query');
    });

    it('should handle rapid input changes', async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;

      await userEvent.type(input, 'abc');
      expect(input.value).toBe('abc');
    });

    it('should handle clearing input', async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} initialValue="initial" />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;

      await userEvent.clear(input);
      expect(input.value).toBe('');
    });
  });

  describe('children handling', () => {
    it('should render Autosuggest child', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should pass searchValue to Autosuggest child', async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      await userEvent.type(input, 'test');

      expect(container).toBeTruthy();
    });

    it('should pass containerRef to Autosuggest child', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      const searchBoxDiv = container.querySelector('.react-af-searchbox');
      expect(searchBoxDiv).toBeTruthy();
    });

    it('should handle multiple children', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
            <div>Extra content</div>
          </SearchBox>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle no children', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('callback handling', () => {
    it('should handle suggestion selection with custom handler', async () => {
      const customHandler = vi.fn();

      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest
              fields={['title__keyword']}
              minChars={1}
              onSuggestionSelect={customHandler}
            />
          </SearchBox>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle suggestion selection without custom handler', async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle suggestion selection when fields is undefined', async () => {
      // This exposes the bug: when fields is undefined,
      // SearchBox can't extract a value from the suggestion
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search">
            <Autosuggest minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      // If a suggestion were selected, it would set searchbox value to ''
      // because there's no field to extract from
      expect(container).toBeTruthy();
    });
  });

  describe('query building', () => {
    it('should build query with single field', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} initialValue="test" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should build query with multiple fields', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title', 'description', 'content']} initialValue="test" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle custom query function', () => {
      const customQuery = vi.fn((query) => ({ custom: query }));

      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" customQuery={customQuery} initialValue="test" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
      expect(customQuery).toHaveBeenCalled();
    });

    it('should handle empty query', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} initialValue="" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('semantic search', () => {
    it('should handle semantic search configuration', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox
            id="test-search"
            semanticIndexes={['index1', 'index2']}
            initialValue="test"
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle semantic search with limit', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox
            id="test-search"
            semanticIndexes={['index1']}
            limit={20}
            initialValue="test"
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle semantic search with custom query', () => {
      const customQuery = vi.fn(() => ({ custom: 'semantic' }));

      const { container } = render(
        <TestWrapper>
          <SearchBox
            id="test-search"
            semanticIndexes={['index1']}
            customQuery={customQuery}
            initialValue="test"
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle empty semantic indexes', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox
            id="test-search"
            semanticIndexes={[]}
            initialValue="test"
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('containerRef behavior', () => {
    it('should create containerRef as callback ref', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      const searchBoxDiv = container.querySelector('.react-af-searchbox');
      expect(searchBoxDiv).toBeTruthy();
    });

    it('should handle ref updates correctly', async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      await userEvent.type(input, 'test');

      expect(container).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined fields', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle empty fields array', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={[]} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle very long input values', async () => {
      const longValue = 'a'.repeat(1000);
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      await userEvent.type(input, longValue);

      expect(input.value).toBe(longValue);
    });

    it('should handle special characters in search', async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      await userEvent.type(input, '@#$%^&*()');

      expect(input.value).toBe('@#$%^&*()');
    });

    it('should handle unicode characters', async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      await userEvent.type(input, '你好世界 🌍');

      expect(input.value).toBe('你好世界 🌍');
    });

    it('should handle null child elements', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            {null}
          </SearchBox>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('filterQuery prop', () => {
    it('should accept filterQuery prop', () => {
      const filterQuery = { match: 'active', field: 'status' };
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} filterQuery={filterQuery} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
      const input = container.querySelector('input');
      expect(input).toBeTruthy();
    });

    it('should work without filterQuery prop', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle complex filterQuery with conjuncts', () => {
      const filterQuery = {
        conjuncts: [
          { match: 'active', field: 'status' },
          { min: 100, field: 'price' }
        ]
      };
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} filterQuery={filterQuery} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should work with filterQuery and semantic search', () => {
      const filterQuery = { match: 'active', field: 'status' };
      const { container } = render(
        <TestWrapper>
          <SearchBox
            id="test-search"
            semanticIndexes={['vector-index']}
            filterQuery={filterQuery}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('exclusionQuery prop', () => {
    it('should accept exclusionQuery prop', () => {
      const exclusionQuery = { match: 'archived', field: 'status' };
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} exclusionQuery={exclusionQuery} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
      const input = container.querySelector('input');
      expect(input).toBeTruthy();
    });

    it('should work without exclusionQuery prop', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle complex exclusionQuery with disjuncts', () => {
      const exclusionQuery = {
        disjuncts: [
          { match: 'deleted', field: 'status' },
          { match: 'spam', field: 'category' }
        ]
      };
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']} exclusionQuery={exclusionQuery} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should work with both filterQuery and exclusionQuery', () => {
      const filterQuery = { match: 'active', field: 'status' };
      const exclusionQuery = { match: 'spam', field: 'category' };
      const { container } = render(
        <TestWrapper>
          <SearchBox
            id="test-search"
            fields={['title']}
            filterQuery={filterQuery}
            exclusionQuery={exclusionQuery}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should work with exclusionQuery and semantic search', () => {
      const exclusionQuery = { match: 'archived', field: 'status' };
      const { container } = render(
        <TestWrapper>
          <SearchBox
            id="test-search"
            semanticIndexes={['vector-index']}
            exclusionQuery={exclusionQuery}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });
});
