import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor, act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import AnswerResults from "./AnswerResults";
import QueryBox from "./QueryBox";
import Antfly from "./Antfly";
import type { GeneratorConfig, QueryHit } from "@antfly/sdk";
import * as utils from "./utils";
import type { AnswerErrorType } from "./utils";

// Wrapper component to provide required context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Antfly url="http://localhost:8082/api/v1" table="test">
      {children}
    </Antfly>
  );
};

// Mock GeneratorConfig for testing
const mockGenerator: GeneratorConfig = {
  provider: "openai",
  model: "gpt-4",
  api_key: "test-key",
};

// Mock hits for testing
const mockHits: QueryHit[] = [
  {
    _id: "1",
    _score: 0.95,
    _source: { title: "Test Document 1", content: "Test content 1" },
  },
  {
    _id: "2",
    _score: 0.85,
    _source: { title: "Test Document 2", content: "Test content 2" },
  },
];

// Mock the streamAnswer function from utils
vi.mock("./utils", async () => {
  const actual = await vi.importActual<typeof utils>("./utils");
  return {
    ...actual,
    streamAnswer: vi.fn(),
  };
});

describe("AnswerResults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults id="answer" searchBoxId="question" generator={mockGenerator} />
        </TestWrapper>,
      );

      expect(container).toBeTruthy();
    });

    it("should show empty state when no question submitted", () => {
      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults id="answer" searchBoxId="question" generator={mockGenerator} />
        </TestWrapper>,
      );

      const emptyMessage = container.querySelector(".react-af-answer-empty");
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage?.textContent).toContain("No results yet");
    });
  });

  describe("fallback behavior", () => {
    it("should show error by default when answer fails (fallbackBehavior='show-error')", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        // Simulate hits arriving before error
        callbacks.onHit?.(mockHits[0]);
        callbacks.onHit?.(mockHits[1]);
        // Then error occurs
        callbacks.onError?.(new Error("Rate limit exceeded"));
        return new AbortController();
      });

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            fallbackBehavior="show-error"
          />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        const error = container.querySelector(".react-af-answer-error");
        expect(error).toBeTruthy();
        expect(error?.textContent).toContain("Rate limit exceeded");
      });

      // Fallback should NOT be shown
      const fallback = container.querySelector(".react-af-answer-fallback");
      expect(fallback).toBeFalsy();
    });

    it("should show hits in fallback mode when answer fails (fallbackBehavior='show-hits')", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        // Simulate hits arriving before error
        callbacks.onHit?.(mockHits[0]);
        callbacks.onHit?.(mockHits[1]);
        // Then error occurs
        callbacks.onError?.(new Error("Rate limit exceeded"));
        return new AbortController();
      });

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            fallbackBehavior="show-hits"
          />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        const fallback = container.querySelector(".react-af-answer-fallback");
        expect(fallback).toBeTruthy();
      });

      // Error should NOT be shown (in fallback mode)
      const error = container.querySelector(".react-af-answer-error");
      expect(error).toBeFalsy();

      // Hits should be displayed
      const hits = container.querySelectorAll(".react-af-answer-fallback-hit");
      expect(hits.length).toBe(2);
    });

    it("should show hits with notice in auto fallback mode (fallbackBehavior='auto')", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.(mockHits[0]);
        callbacks.onHit?.(mockHits[1]);
        callbacks.onError?.(new Error("429 Too Many Requests"));
        return new AbortController();
      });

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            fallbackBehavior="auto"
          />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        const notice = container.querySelector(".react-af-answer-fallback-notice");
        expect(notice).toBeTruthy();
        expect(notice?.textContent).toContain("rate limits");
      });
    });

    it("should call onFallback callback when entering fallback mode", async () => {
      const onFallback = vi.fn();
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.(mockHits[0]);
        callbacks.onHit?.(mockHits[1]);
        callbacks.onError?.(new Error("Rate limit exceeded"));
        return new AbortController();
      });

      render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            fallbackBehavior="auto"
            onFallback={onFallback}
          />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        expect(onFallback).toHaveBeenCalledWith(
          "rate-limit",
          expect.arrayContaining([expect.objectContaining({ _id: "1" })]),
          "Rate limit exceeded",
        );
      });
    });

    it("should use custom renderFallback when provided", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.(mockHits[0]);
        callbacks.onError?.(new Error("Timeout"));
        return new AbortController();
      });

      const customRenderFallback = vi.fn(
        (hits: QueryHit[], errorType: AnswerErrorType, errorMessage: string) => (
          <div className="custom-fallback">
            <span data-testid="error-type">{errorType}</span>
            <span data-testid="error-message">{errorMessage}</span>
            <span data-testid="hit-count">{hits.length}</span>
          </div>
        ),
      );

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            fallbackBehavior="auto"
            renderFallback={customRenderFallback}
          />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        expect(customRenderFallback).toHaveBeenCalled();
        const customFallback = container.querySelector(".custom-fallback");
        expect(customFallback).toBeTruthy();
        expect(screen.getByTestId("error-type").textContent).toBe("timeout");
        expect(screen.getByTestId("hit-count").textContent).toBe("1");
      });
    });

    it("should not enter fallback mode when no hits are available", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        // Error without any hits
        callbacks.onError?.(new Error("Rate limit exceeded"));
        return new AbortController();
      });

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            fallbackBehavior="auto"
          />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        // Should show error since no hits available for fallback
        const error = container.querySelector(".react-af-answer-error");
        expect(error).toBeTruthy();
      });

      const fallback = container.querySelector(".react-af-answer-fallback");
      expect(fallback).toBeFalsy();
    });

    it("should show answer normally when generation succeeds", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.(mockHits[0]);
        callbacks.onAnswer?.("This is the AI answer.");
        callbacks.onComplete?.();
        return new AbortController();
      });

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            fallbackBehavior="auto"
          />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        const answerText = container.querySelector(".react-af-answer-text");
        expect(answerText).toBeTruthy();
        expect(answerText?.textContent).toContain("This is the AI answer");
      });

      // Should NOT be in fallback mode
      const fallback = container.querySelector(".react-af-answer-fallback");
      expect(fallback).toBeFalsy();
    });

    it("should handle fallback when hits arrive but no answer is generated", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onHit?.(mockHits[0]);
        callbacks.onHit?.(mockHits[1]);
        // Complete without any answer
        callbacks.onComplete?.();
        return new AbortController();
      });

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            fallbackBehavior="auto"
          />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        const fallback = container.querySelector(".react-af-answer-fallback");
        expect(fallback).toBeTruthy();
      });
    });
  });

  describe("error classification", () => {
    it("should classify rate limit errors correctly", () => {
      expect(utils.classifyAnswerError("429 Too Many Requests")).toBe("rate-limit");
      expect(utils.classifyAnswerError("Rate limit exceeded")).toBe("rate-limit");
      expect(utils.classifyAnswerError("Quota exceeded for the day")).toBe("rate-limit");
    });

    it("should classify timeout errors correctly", () => {
      expect(utils.classifyAnswerError("Request timeout")).toBe("timeout");
      expect(utils.classifyAnswerError("408 Request Timeout")).toBe("timeout");
      expect(utils.classifyAnswerError("Operation timed out")).toBe("timeout");
    });

    it("should classify generation errors correctly", () => {
      expect(utils.classifyAnswerError("OpenAI API error")).toBe("generation-failed");
      expect(utils.classifyAnswerError("Model not available")).toBe("generation-failed");
      expect(utils.classifyAnswerError("LLM generation failed")).toBe("generation-failed");
      expect(utils.classifyAnswerError("Context length exceeded")).toBe("generation-failed");
    });

    it("should classify network errors correctly", () => {
      expect(utils.classifyAnswerError("Network error")).toBe("network");
      expect(utils.classifyAnswerError("Failed to fetch")).toBe("network");
      expect(utils.classifyAnswerError("ECONNREFUSED")).toBe("network");
    });

    it("should return unknown for unrecognized errors", () => {
      expect(utils.classifyAnswerError("Something went wrong")).toBe("unknown");
      expect(utils.classifyAnswerError("Internal server error")).toBe("unknown");
    });
  });

  describe("streaming behavior", () => {
    it("should stream answer chunks progressively", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onAnswer?.("Hello ");
        callbacks.onAnswer?.("world");
        callbacks.onComplete?.();
        return new AbortController();
      });

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults id="answer" searchBoxId="question" generator={mockGenerator} />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        const answer = container.querySelector(".react-af-answer-text");
        expect(answer).toBeTruthy();
        expect(answer?.textContent).toContain("Hello world");
      });
    });

    it("should show loading state while streaming", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      let resolveComplete: (() => void) | undefined;
      const completePromise = new Promise<void>((resolve) => {
        resolveComplete = resolve;
      });

      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        // Don't call onAnswer or onComplete yet
        await completePromise;
        callbacks.onComplete?.();
        return new AbortController();
      });

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults id="answer" searchBoxId="question" generator={mockGenerator} />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      // Should show loading state
      await waitFor(() => {
        const loading = container.querySelector(".react-af-answer-loading");
        expect(loading).toBeTruthy();
      });

      // Cleanup
      resolveComplete?.();
    });
  });

  describe("error handling", () => {
    it("should display error when fetch fails", async () => {
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onError?.(new Error("Network error"));
        return new AbortController();
      });

      const { container } = render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults id="answer" searchBoxId="question" generator={mockGenerator} />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        const error = container.querySelector(".react-af-answer-error");
        expect(error).toBeTruthy();
        expect(error?.textContent).toContain("Network error");
      });
    });

    it("should call onError callback when error occurs", async () => {
      const onError = vi.fn();
      const mockStreamAnswer = vi.mocked(utils.streamAnswer);
      mockStreamAnswer.mockImplementation(async (_url, _request, _headers, callbacks) => {
        callbacks.onError?.(new Error("Test error"));
        return new AbortController();
      });

      render(
        <TestWrapper>
          <QueryBox id="question" mode="submit" />
          <AnswerResults
            id="answer"
            searchBoxId="question"
            generator={mockGenerator}
            onError={onError}
          />
        </TestWrapper>,
      );

      const input = screen.getByPlaceholderText(/ask a question/i);
      const button = screen.getByRole("button", { name: /submit/i });

      await act(async () => {
        await userEvent.type(input, "test question");
        await userEvent.click(button);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Test error");
      });
    });
  });
});
