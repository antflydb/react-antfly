// Use native fetch API
import qs from "qs";

// Search with msearch to antfly instance
// Todo reject.
export async function msearch(url, msearchData, headers = {}) {
  headers = {
    Accept: "application/json",
    "Content-Type": "application/x-ndjson",
    ...headers,
  };
  const body = msearchData.map((val) => JSON.stringify(val.query)).join("\n") + "\n";
  const rawResponse = await fetch(`${url}/query`, { method: "POST", headers, body });
  return rawResponse.json();
}

// Build a query from a Map of queries
export function queryFrom(queries) {
  return queries?.size === 0 ? { match_none: {} } : { conjuncts: Array.from(queries.values()) };
}

// Convert fields to term queries
export function toTermQueries(fields = [], selectedValues = []) {
  const queries = fields.flatMap((field) =>
    selectedValues.map((value) => {
      // If the field has the suffix .keyword, we use a term query
      // (exact match). Otherwise we use a match query (full text).
      if (field?.endsWith?.(".keyword")) {
        return { field: field.replace(/\.keyword$/, ""), match: value };
      }
      return { field, match: value };
    }),
  );
  if (queries.length === 0) return [{ match_all: {} }];
  return queries;
}

// Todo: clean this ugly funtion
export function fromUrlQueryString(str = "") {
  return new Map([
    ...Object.entries(qs.parse(str?.replace(/^\?/, "") || "")).map(([k, v]) => {
      try {
        return [k, JSON.parse(v)];
      } catch (e) {
        return [k, v];
      }
    }),
  ]);
}

// Todo: clean this ugly funtion
export function toUrlQueryString(params) {
  return qs.stringify(
    Object.fromEntries(
      Array.from(params)
        .filter(([, v]) => (Array.isArray(v) ? v.length : v))
        .map(([k, v]) => [k, JSON.stringify(v)]),
    ),
  );
}

export const defer = (f) => {
  queueMicrotask(f);
};
