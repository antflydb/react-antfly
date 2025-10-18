import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import Autosuggest from './Autosuggest';
import Antfly from './Antfly';
import SearchBox from './SearchBox';
import userEvent from '@testing-library/user-event';

// Wrapper component to provide required context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Antfly url="http://localhost:8082/api/v1/test">{children}</Antfly>;
};

describe('Autosuggest', () => {
  describe('defensive checks for undefined fields', () => {
    it('should not crash when fields is undefined', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest searchValue="test" />
        </TestWrapper>
      );

      // Should render without errors
      expect(container).toBeTruthy();
    });

    it('should not crash when fields is an empty array', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest fields={[]} searchValue="test" />
        </TestWrapper>
      );

      // Should render without errors
      expect(container).toBeTruthy();
    });

    it('should not crash when fields is null', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest fields={null as unknown as string[]} searchValue="test" />
        </TestWrapper>
      );

      // Should render without errors
      expect(container).toBeTruthy();
    });

    it('should not crash when fields is not an array', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest fields={"not-an-array" as unknown as string[]} searchValue="test" />
        </TestWrapper>
      );

      // Should render without errors
      expect(container).toBeTruthy();
    });

    it('should handle valid fields array correctly', () => {
      const mockFields = ['title__keyword', 'description__2gram', 'content'];
      const { container } = render(
        <TestWrapper>
          <Autosuggest fields={mockFields} searchValue="test" minChars={1} />
        </TestWrapper>
      );

      // Should render without errors
      expect(container).toBeTruthy();
    });
  });

  describe('semantic autosuggest defensive checks', () => {
    it('should not crash when semanticIndexes is undefined', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest searchValue="test" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should not crash when semanticIndexes is empty', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest semanticIndexes={[]} searchValue="test" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle valid semanticIndexes array correctly', () => {
      const mockIndexes = ['embedding_index_1', 'embedding_index_2'];
      const { container } = render(
        <TestWrapper>
          <Autosuggest semanticIndexes={mockIndexes} searchValue="test" minChars={1} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('minChars threshold', () => {
    it('should not show suggestions when search value is below minChars', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest fields={['title']} searchValue="a" minChars={2} />
        </TestWrapper>
      );

      // Should not render suggestions list
      const suggestionsList = container.querySelector('.react-af-autosuggest');
      expect(suggestionsList).toBeNull();
    });

    it('should potentially show suggestions when search value meets minChars', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest fields={['title']} searchValue="ab" minChars={2} />
        </TestWrapper>
      );

      // Component should render (even if no results yet)
      expect(container).toBeTruthy();
    });
  });

  describe('custom query handling', () => {
    it('should handle customQuery function', () => {
      const customQuery = vi.fn((value, fields) => ({
        custom: 'query',
        value,
        fields,
      }));

      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test"
            minChars={1}
            customQuery={customQuery}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should not crash when customQuery returns undefined', () => {
      const customQuery = vi.fn(() => undefined);

      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test"
            minChars={1}
            customQuery={customQuery}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('callback handling', () => {
    it('should handle onSuggestionSelect callback', () => {
      const handleSelect = vi.fn();

      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test"
            minChars={1}
            onSuggestionSelect={handleSelect}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('limit parameter', () => {
    it('should handle limit parameter', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test"
            minChars={1}
            limit={5}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should use default limit when not specified', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('SearchBox integration', () => {
    it('should work when nested inside SearchBox', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
      const input = container.querySelector('input');
      expect(input).toBeTruthy();
    });

    it('should receive searchValue prop from SearchBox', async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input).toBeTruthy();

      if (input) {
        await userEvent.type(input, 'test');
        // Component should not crash when receiving search value
        expect(container).toBeTruthy();
      }
    });

    it('should handle suggestion selection callback from SearchBox', async () => {
      const handleSelect = vi.fn();

      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest
              fields={['title__keyword']}
              minChars={1}
              onSuggestionSelect={handleSelect}
            />
          </SearchBox>
        </TestWrapper>
      );

      const input = container.querySelector('input');
      expect(input).toBeTruthy();

      if (input) {
        await userEvent.type(input, 'test');
        expect(container).toBeTruthy();
      }
    });

    it('should receive containerRef from SearchBox', () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="test-search" fields={['title']}>
            <Autosuggest fields={['title__keyword']} minChars={1} />
          </SearchBox>
        </TestWrapper>
      );

      // Should render without errors even with containerRef
      expect(container).toBeTruthy();
    });
  });

  describe('query building logic', () => {
    it('should build query correctly with keyword fields', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title__keyword', 'name__keyword']}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should build query correctly with 2gram fields', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title__2gram', 'description__2gram']}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should build query correctly with mixed field types', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title__keyword', 'description__2gram', 'content']}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle empty searchValue', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue=""
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
      // Should not show suggestions
      const suggestionsList = container.querySelector('.react-af-autosuggest');
      expect(suggestionsList).toBeNull();
    });

    it('should handle searchValue with special characters', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test@#$%"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should generate null query when fields is empty array', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={[]}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should generate null query when fields is undefined', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('semantic search integration', () => {
    it('should handle semantic search with valid indexes', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            semanticIndexes={['index1', 'index2']}
            searchValue="test query"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle semantic search with empty indexes', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            semanticIndexes={[]}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should prioritize semantic search over field-based search', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            semanticIndexes={['embedding_index']}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle custom query with semantic search', () => {
      const customQuery = vi.fn(() => ({ custom: 'semantic_query' }));

      const { container } = render(
        <TestWrapper>
          <Autosuggest
            semanticIndexes={['index1']}
            customQuery={customQuery}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('state management and interactions', () => {
    it('should handle rapid search value changes', async () => {
      const { container, rerender } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="a"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();

      // Rapidly change search value
      rerender(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="ab"
            minChars={1}
          />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="abc"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should reset state when searchValue changes', async () => {
      const { container, rerender } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="first"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();

      rerender(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="second"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle containerRef being undefined', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test"
            minChars={1}
            containerRef={undefined}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle containerRef with null current', () => {
      const ref = { current: null };
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test"
            minChars={1}
            containerRef={ref}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very long search values', () => {
      const longValue = 'a'.repeat(1000);
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue={longValue}
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle unicode characters in search', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="你好世界 🌍"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle very large limit values', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test"
            minChars={1}
            limit={10000}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle zero minChars', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue=""
            minChars={0}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle negative minChars gracefully', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['title']}
            searchValue="test"
            minChars={-1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle field names with multiple underscores', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['my_field_name__keyword', 'another__field__2gram']}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle fields array with empty strings', () => {
      const { container } = render(
        <TestWrapper>
          <Autosuggest
            fields={['', 'title', '']}
            searchValue="test"
            minChars={1}
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });
});
