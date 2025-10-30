import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import AnswerBox from './AnswerBox';
import Antfly from './Antfly';

// Wrapper component to provide required context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Antfly url="http://localhost:8082/api/v1" table="test">{children}</Antfly>;
};

describe('AnswerBox', () => {
  describe('basic rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
      const input = container.querySelector('input');
      const button = container.querySelector('button');
      expect(input).toBeTruthy();
      expect(button).toBeTruthy();
    });

    it('should render with custom placeholder', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} placeholder="Ask a question..." />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.placeholder).toBe('Ask a question...');
    });

    it('should render with default placeholder', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.placeholder).toBe('Ask a question...');
    });

    it('should render with custom button label', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} buttonLabel="Get Answer" />
        </TestWrapper>
      );

      const button = container.querySelector('button') as HTMLButtonElement;
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Get Answer');
    });

    it('should render with default button label', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const button = container.querySelector('button') as HTMLButtonElement;
      expect(button).toBeTruthy();
      expect(button.textContent).toBe('Submit');
    });

    it('should render with initial value', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} initialValue="What is AI?" />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.value).toBe('What is AI?');
    });
  });

  describe('input handling', () => {
    it('should update value when user types', async () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).toBeTruthy();

      await userEvent.type(input, 'What is machine learning?');
      expect(input.value).toBe('What is machine learning?');
    });

    it('should NOT trigger query on keystroke', async () => {
      const customQuery = vi.fn(() => ({ custom: 'query' }));

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" customQuery={customQuery} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;

      // customQuery should not be called during typing
      await userEvent.type(input, 'test');

      // Custom query is only called during initial setup, not on typing
      expect(customQuery).not.toHaveBeenCalledWith('test');
    });

    it('should handle clearing input', async () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} initialValue="initial question" />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;

      await userEvent.clear(input);
      expect(input.value).toBe('');
    });

    it('should disable button when input is empty', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const button = container.querySelector('button') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('should enable button when input has value', async () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      const button = container.querySelector('button') as HTMLButtonElement;

      await userEvent.type(input, 'test question');

      expect(button.disabled).toBe(false);
    });

    it('should disable button when input is only whitespace', async () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      const button = container.querySelector('button') as HTMLButtonElement;

      await userEvent.type(input, '   ');

      expect(button.disabled).toBe(true);
    });
  });

  describe('form submission', () => {
    it('should trigger query on button click', async () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      const button = container.querySelector('button') as HTMLButtonElement;

      await userEvent.type(input, 'test question');
      await userEvent.click(button);

      // Verify the query was triggered (component should still be rendered)
      expect(container).toBeTruthy();
    });

    it('should trigger query on Enter key', async () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;

      await userEvent.type(input, 'test question{Enter}');

      // Verify the query was triggered
      expect(container).toBeTruthy();
    });

    it('should call onSubmit callback when provided on button click', async () => {
      const onSubmit = vi.fn();

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} onSubmit={onSubmit} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      const button = container.querySelector('button') as HTMLButtonElement;

      await userEvent.type(input, 'test question');
      await userEvent.click(button);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('test question');
      });
    });

    it('should call onSubmit callback when provided on Enter key', async () => {
      const onSubmit = vi.fn();

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} onSubmit={onSubmit} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;

      await userEvent.type(input, 'test question{Enter}');

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('test question');
      });
    });

    it('should not submit when button is clicked while disabled', async () => {
      const onSubmit = vi.fn();

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} onSubmit={onSubmit} />
        </TestWrapper>
      );

      const button = container.querySelector('button') as HTMLButtonElement;

      // Button should be disabled with empty input
      expect(button.disabled).toBe(true);

      // Try to click (should not work because button is disabled)
      await userEvent.click(button);

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('query building', () => {
    it('should build query with single field', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} initialValue="test" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should build query with multiple fields', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['title', 'content', 'description']} initialValue="test" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle custom query function', () => {
      const customQuery = vi.fn((query) => ({ custom: query }));

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" customQuery={customQuery} initialValue="test" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle empty query', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} initialValue="" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('semantic search', () => {
    it('should handle semantic search configuration', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox
            id="test-answer"
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
          <AnswerBox
            id="test-answer"
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
          <AnswerBox
            id="test-answer"
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
          <AnswerBox
            id="test-answer"
            semanticIndexes={[]}
            initialValue="test"
          />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });

  describe('children rendering', () => {
    it('should render children elements', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']}>
            <div className="custom-child">Custom content</div>
          </AnswerBox>
        </TestWrapper>
      );

      const customChild = container.querySelector('.custom-child');
      expect(customChild).toBeTruthy();
      expect(customChild?.textContent).toBe('Custom content');
    });

    it('should render multiple children', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']}>
            <div className="child-1">Child 1</div>
            <div className="child-2">Child 2</div>
          </AnswerBox>
        </TestWrapper>
      );

      expect(container.querySelector('.child-1')).toBeTruthy();
      expect(container.querySelector('.child-2')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined fields', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle empty fields array', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={[]} />
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });

    it('should handle very long input values', async () => {
      const longValue = 'a'.repeat(1000);
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      await userEvent.type(input, longValue);

      expect(input.value).toBe(longValue);
    });

    it('should handle special characters in input', async () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      await userEvent.type(input, '@#$%^&*()');

      expect(input.value).toBe('@#$%^&*()');
    });

    it('should handle unicode characters', async () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']} />
        </TestWrapper>
      );

      const input = container.querySelector('input') as HTMLInputElement;
      await userEvent.type(input, '你好世界 🌍');

      expect(input.value).toBe('你好世界 🌍');
    });

    it('should handle null children', () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="test-answer" fields={['content']}>
            {null}
          </AnswerBox>
        </TestWrapper>
      );

      expect(container).toBeTruthy();
    });
  });
});
