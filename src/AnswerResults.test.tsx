import type { GeneratorConfig } from '@antfly/sdk'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AnswerResults from './AnswerResults'
import Antfly from './Antfly'
import QueryBox from './QueryBox'
import * as utils from './utils'

// Wrapper component to provide required context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Antfly url="http://localhost:8082/api/v1" table="test">
      {children}
    </Antfly>
  )
}

// Mock generator config for testing
const mockGenerator: GeneratorConfig = {
  provider: 'openai',
  model: 'gpt-4',
  api_key: 'test-key',
}

// Mock the streamAnswer function from utils
vi.mock('./utils', async () => {
  const actual = await vi.importActual<typeof utils>('./utils')
  return {
    ...actual,
    streamAnswer: vi.fn(),
  }
})

describe('AnswerResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults id="answer" searchBoxId="question" generator={mockGenerator} />
        </TestWrapper>,
      )

      expect(container).toBeTruthy()
    })

    it('should show empty state when no question submitted', () => {
      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults id="answer" searchBoxId="question" generator={mockGenerator} />
        </TestWrapper>,
      )

      const emptyMessage = container.querySelector('.react-af-answer-empty')
      expect(emptyMessage).toBeTruthy()
      expect(emptyMessage?.textContent).toContain('No results yet')
    })
  })

  describe('withoutGeneration prop', () => {
    it('should pass without_generation to the request when withoutGeneration is true', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      mockStreamAnswer.mockImplementation(async (_url, request, _headers, callbacks) => {
        // Verify without_generation is passed
        expect(request.without_generation).toBe(true)
        callbacks.onComplete?.()
        return new AbortController()
      })

      render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={true}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        expect(mockStreamAnswer).toHaveBeenCalled()
      })
    })

    it('should not pass without_generation when withoutGeneration is false', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      mockStreamAnswer.mockImplementation(async (_url, request, _headers, callbacks) => {
        // Verify without_generation is false
        expect(request.without_generation).toBe(false)
        callbacks.onComplete?.()
        return new AbortController()
      })

      render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={false}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        expect(mockStreamAnswer).toHaveBeenCalled()
      })
    })

    it('should show "Loading results..." when withoutGeneration is true', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      // Don't call onComplete to keep it in streaming state
      mockStreamAnswer.mockImplementation(async () => {
        return new AbortController()
      })

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={true}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        const loading = container.querySelector('.react-af-answer-loading')
        expect(loading?.textContent).toContain('Loading results...')
      })
    })

    it('should show "Loading answer..." when withoutGeneration is false', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      // Don't call onComplete to keep it in streaming state
      mockStreamAnswer.mockImplementation(async () => {
        return new AbortController()
      })

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={false}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        const loading = container.querySelector('.react-af-answer-loading')
        expect(loading?.textContent).toContain('Loading answer...')
      })
    })

    it('should render hits directly when withoutGeneration is true and streaming completes', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.({
          _id: '1',
          _score: 0.95,
          _source: { title: 'Test Document', content: 'Test content' },
        })
        callbacks.onHit?.({
          _id: '2',
          _score: 0.85,
          _source: { title: 'Another Document', content: 'More content' },
        })
        callbacks.onComplete?.()
        return new AbortController()
      })

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={true}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        const hitsSection = container.querySelector('.react-af-answer-hits')
        expect(hitsSection).toBeTruthy()
        expect(hitsSection?.textContent).toContain('Search Results (2)')
      })
    })

    it('should call onSearchOnly callback when withoutGeneration is true and streaming completes', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      const onSearchOnly = vi.fn()

      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.({
          _id: '1',
          _score: 0.95,
          _source: { title: 'Test Document' },
        })
        callbacks.onComplete?.()
        return new AbortController()
      })

      render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={true}
            onSearchOnly={onSearchOnly}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        expect(onSearchOnly).toHaveBeenCalledTimes(1)
        expect(onSearchOnly).toHaveBeenCalledWith([
          expect.objectContaining({ _id: '1', _score: 0.95 }),
        ])
      })
    })

    it('should not call onSearchOnly callback when withoutGeneration is false', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      const onSearchOnly = vi.fn()

      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onAnswer?.('Test answer')
        callbacks.onComplete?.()
        return new AbortController()
      })

      render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={false}
            onSearchOnly={onSearchOnly}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        expect(mockStreamAnswer).toHaveBeenCalled()
      })

      // Wait a bit more to ensure callback would have been called if it was going to be
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(onSearchOnly).not.toHaveBeenCalled()
    })

    it('should use renderSearchOnly when provided in search-only mode', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      const renderSearchOnly = vi.fn((hits) => (
        <div className="custom-search-only">Found {hits.length} results</div>
      ))

      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.({
          _id: '1',
          _score: 0.95,
          _source: { title: 'Test' },
        })
        callbacks.onComplete?.()
        return new AbortController()
      })

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={true}
            renderSearchOnly={renderSearchOnly}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        expect(renderSearchOnly).toHaveBeenCalled()
        const customElement = container.querySelector('.custom-search-only')
        expect(customElement?.textContent).toContain('Found 1 results')
      })
    })

    it('should fall back to renderHits when renderSearchOnly is not provided in search-only mode', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      const renderHits = vi.fn((hits) => (
        <div className="custom-hits">Custom hits: {hits.length}</div>
      ))

      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.({
          _id: '1',
          _score: 0.95,
          _source: { title: 'Test' },
        })
        callbacks.onComplete?.()
        return new AbortController()
      })

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={true}
            renderHits={renderHits}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        expect(renderHits).toHaveBeenCalled()
        const customElement = container.querySelector('.custom-hits')
        expect(customElement?.textContent).toContain('Custom hits: 1')
      })
    })

    it('should not render answer-related UI elements in search-only mode', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)

      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.({
          _id: '1',
          _score: 0.95,
          _source: { title: 'Test' },
        })
        callbacks.onComplete?.()
        return new AbortController()
      })

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            withoutGeneration={true}
            showClassification={true}
            showReasoning={true}
            showFollowUpQuestions={true}
            showConfidence={true}
          />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        // Should have hits
        const hitsSection = container.querySelector('.react-af-answer-hits')
        expect(hitsSection).toBeTruthy()

        // Should NOT have answer-related elements even with show* props enabled
        const classification = container.querySelector('.react-af-answer-classification')
        const reasoning = container.querySelector('.react-af-answer-reasoning')
        const answerText = container.querySelector('.react-af-answer-text')
        const confidence = container.querySelector('.react-af-answer-confidence')
        const followUp = container.querySelector('.react-af-answer-follow-up')

        expect(classification).toBeFalsy()
        expect(reasoning).toBeFalsy()
        expect(answerText).toBeFalsy()
        expect(confidence).toBeFalsy()
        expect(followUp).toBeFalsy()
      })
    })
  })

  describe('streaming behavior', () => {
    it('should stream answer chunks progressively', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onAnswer?.('Hello ')
        callbacks.onAnswer?.('world')
        callbacks.onComplete?.()
        return new AbortController()
      })

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults id="answer" searchBoxId="question" generator={mockGenerator} />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        const answerText = container.querySelector('.react-af-answer-text')
        expect(answerText?.textContent).toContain('Hello world')
      })
    })
  })

  describe('error handling', () => {
    it('should display error when request fails', async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer)
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onError?.(new Error('Network error'))
        return new AbortController()
      })

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults id="answer" searchBoxId="question" generator={mockGenerator} />
        </TestWrapper>,
      )

      const input = screen.getByPlaceholderText(/ask a question/i)
      const button = screen.getByRole('button', { name: /submit/i })

      await act(async () => {
        await userEvent.type(input, 'test question')
        await userEvent.click(button)
      })

      await waitFor(() => {
        const error = container.querySelector('.react-af-answer-error')
        expect(error).toBeTruthy()
        expect(error?.textContent).toContain('Network error')
      })
    })
  })
})
