export interface QueryItem {
  query?: unknown;
  combinator?: "AND" | "OR";
}

export interface Operator {
  value: string;
  text: string;
  useInput: boolean;
  query: (key: string | string[], value?: string) => unknown;
}

export interface Combinator {
  value: "AND" | "OR";
  text: string;
}

export interface Rule {
  key?: string;
}

export function mergedQueries(queries: QueryItem[]): Record<string, unknown> {
  // TODO (ajr) Implement must_not?
  const obj = { must: [] as unknown[], should: [] as unknown[] };
  queries
    .filter((q) => q.query)
    .forEach((q, k) => {
      let combinator = q.combinator;
      if (k === 0) {
        combinator = queries.length === 1 ? "AND" : queries[1]?.combinator;
      }
      obj[combinator === "AND" ? "must" : "should"].push(q.query);
    });
  const ret: Record<string, unknown> = {
    must: { conjuncts: obj["must"] },
    should: { disjuncts: obj["should"] },
  };
  if (obj.must.length === 0) {
    delete ret.must;
  }
  if (obj.should.length === 0) {
    delete ret.should;
  }
  return ret;
}

function query(
  key: string | string[],
  value: string | null,
  cb: (k: string, v: string | null) => unknown,
  shouldOrMust: "should" | "must" = "should",
): unknown {
  if (Array.isArray(key)) {
    const junct = shouldOrMust === "should" ? "disjuncts" : "conjuncts";
    return { [shouldOrMust]: { [junct]: key.map((k) => cb(k, value)) } };
  }
  return cb(key, value);
}

export const defaultOperators: Operator[] = [
  {
    value: "==",
    text: "equals",
    useInput: true,
    query: (key: string | string[], value?: string) =>
      value && query(key, value, (k, v) => ({ field: k, match_phrase: v })),
  },
  {
    value: "!=",
    text: "not equals",
    useInput: true,
    query: (key: string | string[], value?: string) =>
      value &&
      query(key, value, (k, v) => ({ must_not: { distjuncts: [{ field: k, term: v }] } }), "must"),
  },
  {
    value: ">=",
    text: "greater than or equals to",
    useInput: true,
    query: (key: string | string[], value?: string) =>
      value && query(key, value, (k, v) => ({ field: k, min: v, inclusive_min: true })),
  },
  {
    value: "<=",
    text: "lesser than or equals to",
    useInput: true,
    query: (key: string | string[], value?: string) =>
      value && query(key, value, (k, v) => ({ field: k, max: v, inclusive_max: true })),
  },
  {
    value: ">",
    text: "greater than",
    useInput: true,
    query: (key: string | string[], value?: string) =>
      value && query(key, value, (k, v) => ({ field: k, min: v })),
  },
  {
    value: "<",
    text: "lesser than",
    useInput: true,
    query: (key: string | string[], value?: string) =>
      value && query(key, value, (k, v) => ({ field: k, max: v })),
  },
  {
    value: "∃",
    text: "exists",
    useInput: false,
    query: (key: string | string[]) =>
      query(key, null, (k) => ({
        // TODO (ajr) This doesn't work in Bleve
        // // Must exists ...
        // must: { exists: { field: k } },
        // ... and must be not empty.
        must_not: { disjuncts: [{ field: k, term: "" }] },
      })),
  },
  // TODO (ajr) This doesn't work in Bleve
  // {
  //   value: "!∃",
  //   text: "does not exist",
  //   useInput: false,
  //   query: (key) =>
  //     query(
  //       key,
  //       null,
  //       (k) => ({
  //         // Should be ...
  //         should: [
  //           // ... empty string ...
  //           { field: k, term: "" },
  //           // ... or not exists.
  //           { must_not: { exists: { field: k } } },
  //         ],
  //       }),
  //       "must"
  //     ),
  // },
  {
    value: "*",
    text: "contains",
    useInput: true,
    query: (key: string | string[], value?: string) =>
      value && query(key, value, (k, v) => ({ field: k, wildcard: `*${v}*` })),
  },
  {
    value: "!*",
    text: "does not contains",
    useInput: true,
    query: (key: string | string[], value?: string) =>
      value &&
      query(
        key,
        value,
        (k, v) => ({
          must_not: { disjuncts: [{ field: k, wildcard: `*${v}*` }] },
        }),
        "must",
      ),
  },
  {
    value: "^",
    text: "start with",
    useInput: true,
    query: (key: string | string[], value?: string) =>
      value && query(key, value, (k, v) => ({ field: k, wildcard: `${v}*` })),
  },
];

export const defaultCombinators: Combinator[] = [
  { value: "AND", text: "AND" },
  { value: "OR", text: "OR" },
];

export function uuidv4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function withUniqueKey<T extends Rule>(rules: T[]): (T & { key: string })[] {
  return rules.map((r) => ({ ...r, key: uuidv4() }));
}
