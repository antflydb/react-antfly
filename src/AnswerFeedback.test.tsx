import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { createContext, useContext } from "react";
import AnswerFeedback from "./AnswerFeedback";
import { renderThumbsUpDown, renderStars, renderNumeric } from "./feedback-renderers";
import { RAGResult } from "@antfly/sdk";

// Create a mock context that matches RAGResultsContextValue
const RAGResultsContext = createContext<{
  query: string;
  result: RAGResult | null;
  isStreaming: boolean;
} | null>(null);

// Mock context provider for testing
const MockRAGResultsProvider = ({
  children,
  query = "test query",
  result = {
    summary_result: { summary: "Test summary" },
    query_results: [
      {
        hits: {
          hits: [
            {
              _id: "1",
              _score: 0.9,
              _source: { content: "test content" },
            },
          ],
          total: 1,
        },
      },
    ],
  } as unknown as RAGResult,
  isStreaming = false,
}: {
  children: React.ReactNode;
  query?: string;
  result?: RAGResult | null;
  isStreaming?: boolean;
}) => {
  return (
    <RAGResultsContext.Provider value={{ query, result, isStreaming }}>
      {children}
    </RAGResultsContext.Provider>
  );
};

// Mock useRAGResultsContext hook
vi.mock("./RAGResults", () => ({
  useRAGResultsContext: () => {
    const context = useContext(RAGResultsContext);
    if (!context) {
      throw new Error("useRAGResultsContext must be used within a RAGResults component");
    }
    return context;
  },
}));

describe("AnswerFeedback", () => {
  describe("basic rendering", () => {
    it("should render with context", () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      expect(container.querySelector(".react-af-answer-feedback")).toBeTruthy();
    });

    it("should not render without result", () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider result={null}>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      expect(container.querySelector(".react-af-answer-feedback")).toBeNull();
    });

    it("should not render while streaming", () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider isStreaming={true}>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      expect(container.querySelector(".react-af-answer-feedback")).toBeNull();
    });
  });

  describe("default renderers", () => {
    it("should render thumbs up/down", () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      expect(container.querySelector(".react-af-feedback-thumbs")).toBeTruthy();
      expect(container.querySelectorAll(".react-af-feedback-thumbs button")).toHaveLength(2);
    });

    it("should render stars", () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback scale={4} renderRating={renderStars} onFeedback={onFeedback} />
        </MockRAGResultsProvider>,
      );

      expect(container.querySelector(".react-af-feedback-stars")).toBeTruthy();
      expect(container.querySelectorAll(".react-af-feedback-star")).toHaveLength(5);
    });

    it("should render numeric scale", () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={3}
            renderRating={(rating, onRate) => renderNumeric(rating, onRate, 3)}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      expect(container.querySelector(".react-af-feedback-numeric")).toBeTruthy();
      expect(container.querySelectorAll(".react-af-feedback-number")).toHaveLength(4);
    });
  });

  describe("interaction", () => {
    it("should show submit button after rating", async () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            enableComments={false}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      // Initially no submit button
      expect(container.querySelector(".react-af-feedback-submit")).toBeNull();

      // Click thumbs up
      const thumbsUp = container.querySelector(".react-af-feedback-thumb-up") as HTMLElement;
      await userEvent.click(thumbsUp);

      // Submit button should appear
      await waitFor(() => {
        expect(container.querySelector(".react-af-feedback-submit")).toBeTruthy();
      });
    });

    it("should call onFeedback when submitted", async () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider query="What is AI?">
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            enableComments={false}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      // Click thumbs up
      const thumbsUp = container.querySelector(".react-af-feedback-thumb-up") as HTMLElement;
      await userEvent.click(thumbsUp);

      // Click submit
      const submitButton = await waitFor(() => {
        const btn = container.querySelector(".react-af-feedback-submit") as HTMLElement;
        expect(btn).toBeTruthy();
        return btn;
      });
      await userEvent.click(submitButton);

      // Check feedback was called
      await waitFor(() => {
        expect(onFeedback).toHaveBeenCalledWith(
          expect.objectContaining({
            feedback: expect.objectContaining({
              rating: 1,
              scale: 1,
            }),
            query: "What is AI?",
          }),
        );
      });
    });

    it("should hide after submission", async () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            enableComments={false}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      // Click and submit
      const thumbsUp = container.querySelector(".react-af-feedback-thumb-up") as HTMLElement;
      await userEvent.click(thumbsUp);

      const submitButton = await waitFor(() => {
        const btn = container.querySelector(".react-af-feedback-submit") as HTMLElement;
        expect(btn).toBeTruthy();
        return btn;
      });
      await userEvent.click(submitButton);

      // Component should be hidden
      await waitFor(() => {
        expect(container.querySelector(".react-af-answer-feedback")).toBeNull();
      });
    });
  });

  describe("comments", () => {
    it("should show comment field when enabled", async () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            enableComments={true}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      // Click rating
      const thumbsUp = container.querySelector(".react-af-feedback-thumb-up") as HTMLElement;
      await userEvent.click(thumbsUp);

      // Comment field should appear
      await waitFor(() => {
        expect(container.querySelector(".react-af-feedback-comment-input")).toBeTruthy();
      });
    });

    it("should not show comment field when disabled", async () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            enableComments={false}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      // Click rating
      const thumbsUp = container.querySelector(".react-af-feedback-thumb-up") as HTMLElement;
      await userEvent.click(thumbsUp);

      // Wait for submit button but verify no comment field
      await waitFor(() => {
        expect(container.querySelector(".react-af-feedback-submit")).toBeTruthy();
      });
      expect(container.querySelector(".react-af-feedback-comment-input")).toBeNull();
    });

    it("should include comment in feedback data", async () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            enableComments={true}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      // Click rating
      const thumbsUp = container.querySelector(".react-af-feedback-thumb-up") as HTMLElement;
      await userEvent.click(thumbsUp);

      // Type comment
      const commentField = await waitFor(() => {
        const field = container.querySelector(
          ".react-af-feedback-comment-input",
        ) as HTMLTextAreaElement;
        expect(field).toBeTruthy();
        return field;
      });
      await userEvent.type(commentField, "Great answer!");

      // Submit
      const submitButton = container.querySelector(
        ".react-af-feedback-submit",
      ) as HTMLButtonElement;
      await userEvent.click(submitButton);

      // Check comment was included
      await waitFor(() => {
        expect(onFeedback).toHaveBeenCalledWith(
          expect.objectContaining({
            feedback: expect.objectContaining({
              rating: 1,
              scale: 1,
              comment: "Great answer!",
            }),
          }),
        );
      });
    });
  });

  describe("custom labels", () => {
    it("should use custom placeholder", async () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            commentPlaceholder="Tell us more..."
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      const thumbsUp = container.querySelector(".react-af-feedback-thumb-up") as HTMLElement;
      await userEvent.click(thumbsUp);

      const commentField = await waitFor(() => {
        const field = container.querySelector(
          ".react-af-feedback-comment-input",
        ) as HTMLTextAreaElement;
        expect(field).toBeTruthy();
        return field;
      });

      expect(commentField.placeholder).toBe("Tell us more...");
    });

    it("should use custom submit label", async () => {
      const onFeedback = vi.fn();
      const { container } = render(
        <MockRAGResultsProvider>
          <AnswerFeedback
            scale={1}
            renderRating={renderThumbsUpDown}
            submitLabel="Send Feedback"
            enableComments={false}
            onFeedback={onFeedback}
          />
        </MockRAGResultsProvider>,
      );

      const thumbsUp = container.querySelector(".react-af-feedback-thumb-up") as HTMLElement;
      await userEvent.click(thumbsUp);

      const submitButton = await waitFor(() => {
        const btn = container.querySelector(".react-af-feedback-submit") as HTMLButtonElement;
        expect(btn).toBeTruthy();
        return btn;
      });

      expect(submitButton.textContent).toBe("Send Feedback");
    });
  });
});
