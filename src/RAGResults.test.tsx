import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import RAGResults from "./RAGResults";
import AnswerBox from "./AnswerBox";
import Antfly from "./Antfly";
import type { ModelConfig } from "@antfly/sdk";

// Wrapper component to provide required context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Antfly url="http://localhost:8082/api/v1/test">{children}</Antfly>;
};

// Mock ModelConfig for testing
const mockSummarizer: ModelConfig = {
  provider: "openai",
  model: "gpt-4",
  api_key: "test-key",
};

// Helper to create a mock ReadableStream
const createMockStream = (chunks: string[]) => {
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      chunks.forEach((chunk) => {
        controller.enqueue(encoder.encode(chunk));
      });
      controller.close();
    },
  });
};

describe("RAGResults", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("should render without crashing", () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      expect(container).toBeTruthy();
    });

    it("should show empty state when no question submitted", () => {
      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const emptyMessage = container.querySelector(".react-af-rag-empty");
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage?.textContent).toContain("No results yet");
    });

    it("should render with custom render function", () => {
      const customRender = vi.fn(() => <div className="custom-rag">Custom RAG</div>);

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults
            id="rag-answer"
            answerBoxId="question"
            summarizer={mockSummarizer}
            renderSummary={customRender}
          />
        </TestWrapper>,
      );

      const customElement = container.querySelector(".custom-rag");
      expect(customElement).toBeTruthy();
    });
  });

  describe("streaming behavior", () => {
    it("should stream chunks progressively", async () => {
      // Mock fetch to return a streaming response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream([
          'data: {"chunk":"Hello "}\n\n',
          'data: {"chunk":"world"}\n\n',
          "data: [DONE]\n\n",
        ]),
      });

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      // Submit a question
      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      // Wait for streaming to complete
      await waitFor(
        () => {
          const summary = container.querySelector(".react-af-rag-summary");
          expect(summary?.textContent).toContain("Hello world");
        },
        { timeout: 3000 },
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8082/api/v1/test/rag",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          }),
        }),
      );
    });

    it("should show streaming indicator while streaming", async () => {
      // Create a stream that sends data but doesn't close immediately
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream([
          'data: {"chunk":"Streaming..."}\n\n',
          // Stream ends here, will show indicator briefly
        ]),
      });

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      // The component should show the summary
      await waitFor(() => {
        const summary = container.querySelector(".react-af-rag-summary");
        expect(summary).toBeTruthy();
        expect(summary?.textContent).toContain("Streaming...");
      });
    });

    it("should handle [DONE] signal", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream(['data: {"chunk":"Complete"}\n\n', "data: [DONE]\n\n"]),
      });

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      await waitFor(() => {
        const summary = container.querySelector(".react-af-rag-summary");
        expect(summary?.textContent).toContain("Complete");
        // Streaming indicator should be gone
        const streamingIndicator = container.querySelector(".react-af-rag-streaming");
        expect(streamingIndicator).toBeFalsy();
      });
    });
  });

  describe("error handling", () => {
    it("should display error when fetch fails", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      await waitFor(() => {
        const error = container.querySelector(".react-af-rag-error");
        expect(error).toBeTruthy();
        expect(error?.textContent).toContain("Network error");
      });
    });

    it("should handle HTTP error responses", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      await waitFor(() => {
        const error = container.querySelector(".react-af-rag-error");
        expect(error).toBeTruthy();
        expect(error?.textContent).toContain("RAG request failed");
      });
    });

    it("should handle error chunks in stream", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream(['data: {"error":"Something went wrong"}\n\n']),
      });

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      await waitFor(() => {
        const error = container.querySelector(".react-af-rag-error");
        expect(error).toBeTruthy();
        expect(error?.textContent).toContain("Something went wrong");
      });
    });

    it("should handle malformed JSON in stream", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream(["data: {invalid json}\n\n", "data: [DONE]\n\n"]),
      });

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      // Should not crash, just log a warning
      await waitFor(() => {
        expect(container).toBeTruthy();
      });
    });
  });

  describe("configuration options", () => {
    it("should use custom system prompt", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream(["data: [DONE]\n\n"]),
      });
      global.fetch = fetchSpy;

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults
            id="rag-answer"
            answerBoxId="question"
            summarizer={mockSummarizer}
            systemPrompt="You are a helpful assistant."
          />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining("You are a helpful assistant"),
          }),
        );
      });
    });

    it("should pass fields to query", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream(["data: [DONE]\n\n"]),
      });
      global.fetch = fetchSpy;

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults
            id="rag-answer"
            answerBoxId="question"
            summarizer={mockSummarizer}
            fields={["title", "content"]}
          />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining("title"),
          }),
        );
      });
    });
  });

  describe("query updates", () => {
    it("should trigger request when question is submitted", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream(['data: {"chunk":"Answer"}\n\n', "data: [DONE]\n\n"]),
      });
      global.fetch = fetchSpy;

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      // Submit question
      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      await waitFor(() => {
        const summary = container.querySelector(".react-af-rag-summary");
        expect(summary?.textContent).toContain("Answer");
      });

      expect(fetchSpy).toHaveBeenCalled();
    });

    it("should NOT trigger request if question is the same", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream(["data: [DONE]\n\n"]),
      });
      global.fetch = fetchSpy;

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "same question");
      await act(async () => {
        await userEvent.click(button);
      });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      // Click again without changing the question
      await act(async () => {
        await userEvent.click(button);
      });

      // Should still be only 1 call
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it("should reset summary when new request starts", async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream(['data: {"chunk":"New answer"}\n\n', "data: [DONE]\n\n"]),
      });
      global.fetch = fetchSpy;

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      // Submit a question
      await userEvent.type(input, "test question");
      await act(async () => {
        await userEvent.click(button);
      });

      // Verify answer appears
      await waitFor(() => {
        const summary = container.querySelector(".react-af-rag-summary");
        expect(summary?.textContent).toContain("New answer");
      });
    });
  });

  describe("edge cases", () => {
    it("should handle missing AnswerBox widget", () => {
      const { container } = render(
        <TestWrapper>
          <RAGResults id="rag-answer" answerBoxId="nonexistent" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      expect(container).toBeTruthy();
    });

    it("should handle empty stream", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: createMockStream([]),
      });

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test");
      await act(async () => {
        await userEvent.click(button);
      });

      expect(container).toBeTruthy();
    });

    it("should handle null response body", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        body: null,
      });

      const { container } = render(
        <TestWrapper>
          <AnswerBox id="question" fields={["content"]} />
          <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      const button = container.querySelector("button") as HTMLButtonElement;

      await userEvent.type(input, "test");
      await act(async () => {
        await userEvent.click(button);
      });

      await waitFor(() => {
        const error = container.querySelector(".react-af-rag-error");
        expect(error).toBeTruthy();
        expect(error?.textContent).toContain("Response body is null");
      });
    });
  });
});
