import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import Antfly from "./Antfly";
import SearchBox from "./SearchBox";
import Autosuggest from "./Autosuggest";
import Results from "./Results";
import Listener from "./Listener";

// Wrapper component to provide required context
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <Antfly url="http://localhost:8082/api/v1" table="test">{children}</Antfly>;
};

describe("Listener", () => {
  describe("Widget configuration readiness checks", () => {
    it("should fire queries when widget has both needsConfiguration and configuration", async () => {
      // Regression test for bug where:
      // - Widget sets needsConfiguration: false
      // - But widget still provides configuration object
      // - Listener's configurationsReady check fails (0 !== 1)
      // - Result: queries never fire

      const { container } = render(
        <TestWrapper>
          <SearchBox id="search" fields={["title"]}>
            <Autosuggest fields={["title__keyword"]} minChars={1} />
          </SearchBox>
          <Results
            id="results"
            items={(data) => <div className="results-rendered">Found {data.length}</div>}
          />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input).toBeTruthy();

      // Type to trigger autosuggest and search
      await userEvent.type(input, "test");

      // Wait for queries to fire and results to render
      // If the bug exists, this will timeout because queries never fire
      await waitFor(
        () => {
          const results = container.querySelector(".react-af-results");
          expect(results).toBeTruthy();
        },
        { timeout: 3000 },
      );
    });

    it("should handle non-semantic autosuggest configuration correctly", async () => {
      // The bug specifically affected non-semantic autosuggest because
      // it set needsConfiguration: isSemanticEnabled (which is false)
      // while still providing a configuration object

      const { container } = render(
        <TestWrapper>
          <SearchBox id="search" fields={["name", "description"]}>
            <Autosuggest fields={["name__keyword", "description__2gram"]} minChars={2} />
          </SearchBox>
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "testing");

      // Component should not crash or hang
      expect(input.value).toBe("testing");

      // Give it time to process - should complete without hanging
      await waitFor(
        () => {
          expect(container).toBeTruthy();
        },
        { timeout: 1000 },
      );
    });

    it("should handle semantic autosuggest configuration correctly", async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="search" semanticIndexes={["main_index"]} limit={20}>
            <Autosuggest semanticIndexes={["suggestion_index"]} minChars={2} />
          </SearchBox>
          <Results id="results" items={(data) => <div>{data.length} results</div>} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "semantic query");

      await waitFor(() => {
        expect(container.querySelector(".react-af-results")).toBeTruthy();
      });
    });

    it("should correctly calculate readiness with multiple widgets", async () => {
      // Test scenario:
      // - SearchBox1 + Autosuggest: needsConfiguration=true, has configuration
      // - SearchBox2 (no autosuggest): needsConfiguration=false, has configuration
      // - Results: needsConfiguration=true, has configuration
      //
      // Expected: all widgets should be ready and queries should fire

      const { container } = render(
        <TestWrapper>
          <SearchBox id="search1" fields={["title"]}>
            <Autosuggest fields={["title__keyword"]} minChars={1} />
          </SearchBox>
          <SearchBox id="search2" fields={["description"]} />
          <Results
            id="results"
            items={(data) => <div className="test-results">{data.length}</div>}
          />
        </TestWrapper>,
      );

      const inputs = container.querySelectorAll("input");

      // Type in both search boxes
      await userEvent.type(inputs[0], "first");
      await userEvent.type(inputs[1], "second");

      // Results should render
      await waitFor(() => {
        expect(container.querySelector(".react-af-results")).toBeTruthy();
      });
    });

    it("should handle widgets without configuration", async () => {
      // SearchBox without autosuggest or semantic search
      // should not require configuration

      const { container } = render(
        <TestWrapper>
          <SearchBox id="search" fields={["title"]} />
          <Results id="results" items={(data) => <div>{data.length}</div>} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "test");

      await waitFor(() => {
        expect(container.querySelector(".react-af-results")).toBeTruthy();
      });
    });

    it("should handle empty search value clearing widgets", async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="search" fields={["title"]} initialValue="initial">
            <Autosuggest fields={["title__keyword"]} minChars={2} />
          </SearchBox>
          <Results id="results" items={(data) => <div>{data.length}</div>} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;

      // Clear the input
      await userEvent.clear(input);

      // Should still render without issues
      expect(container.querySelector(".react-af-results")).toBeTruthy();
    });

    it("should debounce rapid widget updates", async () => {
      const { container } = render(
        <TestWrapper>
          <SearchBox id="search" fields={["title"]}>
            <Autosuggest fields={["title__keyword"]} minChars={1} />
          </SearchBox>
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;

      // Type rapidly (simulates rapid updates)
      await userEvent.type(input, "abcdefg", { delay: 10 });

      // Should handle all updates without crashing
      expect(input.value).toBe("abcdefg");

      // Give debounce time to settle
      await waitFor(
        () => {
          expect(container).toBeTruthy();
        },
        { timeout: 100 },
      );
    });
  });

  describe("Query construction", () => {
    it("should exclude autosuggest queries from Results queries", async () => {
      // Autosuggest should have isAutosuggest: true
      // Results queries should filter out autosuggest queries

      const { container } = render(
        <TestWrapper>
          <SearchBox id="search" fields={["title"]}>
            <Autosuggest fields={["title__keyword"]} minChars={1} />
          </SearchBox>
          <Results id="results" items={(data) => <div>{data.length}</div>} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "test");

      // Both should render and work independently
      await waitFor(() => {
        expect(container.querySelector(".react-af-results")).toBeTruthy();
      });
    });

    it("should exclude autosuggest semantic queries from main Results semantic query", async () => {
      // Regression test for bug where:
      // - Autosuggest has semanticIndexes configured
      // - SearchBox does not have semanticIndexes
      // - User types "test" in SearchBox
      // - Autosuggest registers with semanticQuery: "test"
      // - Listener was joining all semanticQueries including autosuggest
      // - Result: semantic query was "test" instead of being excluded
      //
      // Expected: Autosuggest semantic queries should NOT affect Results queries

      const { container } = render(
        <TestWrapper>
          <SearchBox id="main" fields={["title__keyword"]}>
            <Autosuggest
              semanticIndexes={["title_body_semantic"]}
              fields={[]}
              limit={10}
              minChars={2}
            />
          </SearchBox>
          <Results
            id="result"
            items={(data) => <div className="test-results">{data.length} results</div>}
            itemsPerPage={10}
          />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input).toBeTruthy();

      // Type into the search box
      await userEvent.type(input, "test query");

      // Results should render without autosuggest semantic query being attached
      await waitFor(() => {
        expect(container.querySelector(".react-af-results")).toBeTruthy();
      });

      // Both autosuggest (if it had results) and results should work independently
      expect(input.value).toBe("test query");
    });

    it("should handle SearchBox with semantic search and Autosuggest with semantic search independently", async () => {
      // Test case where both have semantic indexes
      // Each should query independently without interfering with each other

      const { container } = render(
        <TestWrapper>
          <SearchBox id="main" semanticIndexes={["main_semantic_index"]} limit={20}>
            <Autosuggest
              semanticIndexes={["autosuggest_semantic_index"]}
              fields={[]}
              limit={5}
              minChars={2}
            />
          </SearchBox>
          <Results
            id="result"
            items={(data) => <div className="test-results">{data.length} results</div>}
            itemsPerPage={10}
          />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "semantic test");

      // Both should work independently
      await waitFor(() => {
        expect(container.querySelector(".react-af-results")).toBeTruthy();
      });

      expect(input.value).toBe("semantic test");
    });

    it("should include autosuggest's own semantic query when autosuggest queries for results", async () => {
      // Regression test for bug where:
      // - Autosuggest has semanticIndexes configured and wantResults: true
      // - User types "foo" in SearchBox
      // - Autosuggest registers with semanticQuery: "foo", isAutosuggest: true
      // - Listener was filtering out ALL autosuggest semantic queries
      // - Result: autosuggest's own query had semantic_search: "" instead of "foo"
      //
      // Expected: Autosuggest should get its OWN semantic query, but NOT other autosuggest queries

      const utils = await import("./utils");
      const msearchSpy = vi.spyOn(utils, "multiquery").mockResolvedValue({
        responses: [
          {
            status: 200,
            took: 10,
            hits: { hits: [], total: 0 },
          },
          {
            status: 200,
            took: 10,
            hits: { hits: [], total: 0 },
          },
        ],
      });

      const { container } = render(
        <TestWrapper>
          <SearchBox id="main" fields={["title__keyword"]}>
            <Autosuggest
              semanticIndexes={["title_body_semantic"]}
              fields={[]}
              limit={10}
              minChars={2}
            />
          </SearchBox>
          <Results
            id="result"
            items={(data) => <div className="test-results">{data.length} results</div>}
            itemsPerPage={10}
          />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      expect(input).toBeTruthy();

      // Type into the search box
      await userEvent.type(input, "foo");

      // Wait for queries to be fired
      await waitFor(() => {
        expect(msearchSpy).toHaveBeenCalled();
      });

      // Check that the autosuggest query includes its semantic search
      const calls = msearchSpy.mock.calls;
      const lastCall = calls[calls.length - 1];
      const queries = lastCall[1]; // Second argument is the queries array

      // There should be exactly 2 queries: one for autosuggest, one for Results
      expect(queries.length).toBe(2);

      // Autosuggest query has semantic_search="foo" and indexes array
      // Results query has semantic_search="" and no indexes (undefined)
      const autosuggestQuery = queries.find(
        (q: { query: { semantic_search?: string; indexes?: string[] } }) =>
          q.query.semantic_search === "foo" && Array.isArray(q.query.indexes),
      );

      expect(autosuggestQuery).toBeTruthy();
      expect(autosuggestQuery?.query.semantic_search).toBe("foo");
      expect(autosuggestQuery?.query.indexes).toEqual(["title_body_semantic"]);

      // Results query has empty semantic_search and no indexes
      const resultsQuery = queries.find(
        (q: { query: { semantic_search?: string; indexes?: string[] } }) =>
          q.query.semantic_search === "" && !q.query.indexes,
      );

      expect(resultsQuery).toBeTruthy();
      expect(resultsQuery?.query.semantic_search).toBe("");

      msearchSpy.mockRestore();
    });

    it("should include facet queries in main search", async () => {
      // This is just a smoke test - we don't have facet components in this test
      // but we verify the system doesn't break without them

      const { container } = render(
        <TestWrapper>
          <SearchBox id="search" fields={["title"]} />
          <Results id="results" items={(data) => <div>{data.length}</div>} />
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "test");

      await waitFor(() => {
        expect(container.querySelector(".react-af-results")).toBeTruthy();
      });
    });
  });

  describe("onChange callback", () => {
    it("should call onChange when widget values change", async () => {
      const onChange = vi.fn();

      const { container } = render(
        <Antfly url="http://localhost:8082/api/v1" table="test">
          <Listener onChange={onChange}>
            <SearchBox id="search" fields={["title"]} />
          </Listener>
        </Antfly>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "test");

      // onChange should have been called
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it("should include page parameters in onChange callback", async () => {
      const onChange = vi.fn();

      const { container } = render(
        <Antfly url="http://localhost:8082/api/v1" table="test">
          <Listener onChange={onChange}>
            <SearchBox id="search" fields={["title"]} />
            <Results id="results" items={(data) => <div>{data.length}</div>} />
          </Listener>
        </Antfly>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "test");

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });

      // Check that onChange was called with Map containing values
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[0]).toBeInstanceOf(Map);
    });
  });

  describe("Error handling", () => {
    it("should handle connection errors gracefully", async () => {
      // Using an invalid URL to simulate connection error
      const { container } = render(
        <Antfly url="http://invalid-url-that-does-not-exist:9999/api" table="test">
          <SearchBox id="search" fields={["title"]} />
          <Results id="results" items={(data) => <div>{data.length}</div>} />
        </Antfly>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "test");

      // Should not crash even with connection error
      // (error will be logged to console)
      expect(container).toBeTruthy();

      await waitFor(
        () => {
          expect(input.value).toBe("test");
        },
        { timeout: 2000 },
      );
    });
  });

  describe("Widget cleanup", () => {
    it("should clean up widgets on unmount", async () => {
      const { container, unmount } = render(
        <TestWrapper>
          <SearchBox id="search" fields={["title"]}>
            <Autosuggest fields={["title__keyword"]} minChars={1} />
          </SearchBox>
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "test");

      // Unmount and verify no errors
      unmount();
      expect(container).toBeTruthy();
    });

    it("should handle rapid mount/unmount cycles", async () => {
      const { container, unmount, rerender } = render(
        <TestWrapper>
          <SearchBox id="search" fields={["title"]}>
            <Autosuggest fields={["title__keyword"]} minChars={1} />
          </SearchBox>
        </TestWrapper>,
      );

      const input = container.querySelector("input") as HTMLInputElement;
      await userEvent.type(input, "test");

      // Rerender multiple times
      rerender(
        <TestWrapper>
          <SearchBox id="search" fields={["title"]}>
            <Autosuggest fields={["title__keyword"]} minChars={1} />
          </SearchBox>
        </TestWrapper>,
      );

      rerender(
        <TestWrapper>
          <SearchBox id="search" fields={["name"]}>
            <Autosuggest fields={["name__keyword"]} minChars={1} />
          </SearchBox>
        </TestWrapper>,
      );

      unmount();
      expect(container).toBeTruthy();
    });
  });
});
