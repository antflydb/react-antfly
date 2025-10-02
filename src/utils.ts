import qs from "qs";
import { AntflyClient, QueryRequest, QueryResponses } from "@antfly/sdk";

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
      } catch (e) {
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
