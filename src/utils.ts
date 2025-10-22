import qs from "qs";
import { AntflyClient, QueryRequest, QueryResponses, RAGRequest, RAGResult } from "@antfly/sdk";

export interface MultiqueryRequest {
  query: QueryRequest;
}

let defaultClient: AntflyClient | null = null;

export function initializeAntflyClient(
  url: string,
  headers: Record<string, string> = {},
): AntflyClient {
  defaultClient = new AntflyClient({
    baseUrl: url,
    headers,
  });
  return defaultClient;
}

export function getAntflyClient(): AntflyClient {
  if (!defaultClient) {
    throw new Error("AntflyClient not initialized. Call initializeAntflyClient first.");
  }
  return defaultClient;
}

export async function msearch(
  url: string,
  msearchData: MultiqueryRequest[],
  headers: Record<string, string> = {},
): Promise<QueryResponses | undefined> {
  try {
    let client = defaultClient;

    if (!client) {
      client = initializeAntflyClient(url, headers);
    }

    const queries = msearchData.map((item) => item.query);
    const result = await client.multiquery(queries);
    return result;
  } catch (error) {
    console.error("Failed to connect to Antfly:", error);

    return {
      responses: msearchData.map(() => ({
        status: 500,
        took: 0,
        error: error instanceof Error ? error.message : "Connection failed",
      })),
    };
  }
}

export function conjunctsFrom(queries?: Map<string, unknown>): Record<string, unknown> {
  if (!queries) return { match_all: {} };
  if (queries.size === 0) return { match_none: {} };
  if (queries.size === 1) return queries.values().next().value as Record<string, unknown>;
  const conjuncts = Array.from(queries.values()).filter(
    (a) => !(a && typeof a === "object" && "match_all" in a && Object.keys(a).length === 1),
  );
  if (conjuncts.length === 0) return { match_all: {} };
  if (conjuncts.length === 1) return conjuncts[0] as Record<string, unknown>;
  return { conjuncts };
}

export function disjunctsFrom(queries?: Array<Record<string, unknown>>): Record<string, unknown> {
  if (!queries) return { match_all: {} };
  if (queries.length === 0) return { match_none: {} };
  if (queries.length === 1) return queries[0];
  const disjuncts = Array.from(queries.values()).filter(
    (a) => !(a && typeof a === "object" && "match_all" in a && Object.keys(a).length === 1),
  );
  if (disjuncts.length === 0) return { match_all: {} };
  if (disjuncts.length === 1) return disjuncts[0] as Record<string, unknown>;
  return { disjuncts };
}

export function toTermQueries(
  fields: string[] = [],
  selectedValues: string[] = [],
): Array<Record<string, unknown>> {
  const queries = fields.flatMap((field) =>
    selectedValues.map((value) => {
      return { field, match: value };
    }),
  );
  if (queries.length === 0) return [{ match_all: {} }];
  return queries;
}

export function fromUrlQueryString(str = ""): Map<string, unknown> {
  return new Map([
    ...Object.entries(qs.parse(str?.replace(/^\?/, "") || "")).map(([k, v]) => {
      try {
        return [k, typeof v === "string" ? JSON.parse(v) : v] as [string, unknown];
      } catch {
        return [k, v] as [string, unknown];
      }
    }),
  ]);
}

export function toUrlQueryString(params: Map<string, unknown>): string {
  return qs.stringify(
    Object.fromEntries(
      Array.from(params)
        .filter(([, v]) => (Array.isArray(v) ? v.length : v))
        .map(([k, v]) => [k, JSON.stringify(v)]),
    ),
  );
}

export const defer = (f: () => void): void => {
  queueMicrotask(f);
};

// RAG-related types and functions
export interface SSEChunk {
  chunk?: string;
  error?: string;
}

/**
 * Stream RAG results from the Antfly /rag endpoint using Server-Sent Events or JSON
 * @param url - Base URL of the Antfly server
 * @param request - RAG request containing query and summarizer config
 * @param headers - Optional HTTP headers for authentication
 * @param onChunk - Callback for each chunk of the summary (used in streaming mode)
 * @param onComplete - Callback when the stream completes
 * @param onError - Callback for errors
 * @param onRAGResult - Callback for RAG result with query results and summary (used when with_citations is true)
 * @returns AbortController to cancel the stream
 */
export async function streamRAG(
  url: string,
  request: RAGRequest,
  headers: Record<string, string> = {},
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void,
  onRAGResult?: (result: RAGResult) => void,
): Promise<AbortController> {
  const abortController = new AbortController();

  try {
    // Extract base URL by removing /table/{tableName} suffix if present
    const baseUrl = url.replace(/\/table\/[^/]+$/, "");

    const response = await fetch(`${baseUrl}/rag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream, application/json",
        ...headers,
      },
      body: JSON.stringify(request),
      signal: abortController.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`RAG request failed: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // Check content type to determine response format
    const contentType = response.headers.get("content-type") || "";
    const isJSON = contentType.includes("application/json");

    // Handle JSON response with query results and citations
    if (isJSON) {
      const ragResult = (await response.json()) as RAGResult;
      if (onRAGResult) {
        onRAGResult(ragResult);
      }
      onComplete();
      return abortController;
    }

    // Handle SSE streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Read the stream
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onComplete();
        break;
      }

      // Decode the chunk and add to buffer
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      let currentEvent = "";
      for (const line of lines) {
        if (!line.trim()) continue;

        // Check for event type
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
          continue;
        }

        // Handle data lines
        if (line.startsWith("data: ")) {
          // Extract data after "data: " - don't trim to preserve spaces in tokens
          const data = line.slice(6);

          // Handle special events
          if (currentEvent === "done" || data === "[DONE]" || data === "complete") {
            onComplete();
            return abortController;
          }

          if (currentEvent === "error") {
            onError(new Error(data));
            currentEvent = "";
            continue;
          }

          // Try to parse as JSON first (for structured data)
          try {
            const parsed = JSON.parse(data) as SSEChunk;
            if (parsed.chunk) {
              onChunk(parsed.chunk);
            } else if (parsed.error) {
              onError(new Error(parsed.error));
            }
          } catch {
            // If not JSON, treat as plain text chunk
            if (data) {
              onChunk(data);
            }
          }

          currentEvent = "";
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.log("RAG stream aborted");
      } else {
        onError(error);
      }
    } else {
      onError(new Error("Unknown error occurred during RAG streaming"));
    }
  }

  return abortController;
}
