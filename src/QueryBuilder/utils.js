export function mergedQueries(queries) {
  // TODO (ajr) Implement must_not?
  let obj = { must: [], should: [] };
  queries
    .filter((q) => q.query)
    .forEach((q, k) => {
      let combinator = q.combinator;
      if (k === 0) {
        combinator = queries.length === 1 ? "AND" : queries[1].combinator;
      }
      obj[combinator === "AND" ? "must" : "should"].push(q.query);
    });
  let ret = { must: { conjuncts: obj["must"] }, should: { disjuncts: obj["should"] } };
  if (obj.must.length === 0) {
    delete ret.must;
  }
  if (obj.should.length === 0) {
    delete ret.should;
  }
  return ret;
}

function query(key, value, cb, shouldOrMust = "should") {
  if (Array.isArray(key)) {
    const junct = shouldOrMust === "should" ? "disjuncts" : "conjuncts";
    return { [shouldOrMust]: { [junct]: key.map((k) => cb(k, value)) } };
  }
  return cb(key, value);
}

export const defaultOperators = [
  {
    value: "==",
    text: "equals",
    useInput: true,
    query: (key, value) => value && query(key, value, (k, v) => ({ field: k, match: v })),
  },
  {
    value: "!=",
    text: "not equals",
    useInput: true,
    query: (key, value) =>
      value &&
      query(key, value, (k, v) => ({ must_not: { distjuncts: [{ field: k, term: v }] } }), "must"),
  },
  {
    value: ">=",
    text: "greater than or equals to",
    useInput: true,
    query: (key, value) =>
      value && query(key, value, (k, v) => ({ field: k, min: v, inclusive_min: true })),
  },
  {
    value: "<=",
    text: "lesser than or equals to",
    useInput: true,
    query: (key, value) =>
      value && query(key, value, (k, v) => ({ field: k, max: v, inclusive_max: true })),
  },
  {
    value: ">",
    text: "greater than",
    useInput: true,
    query: (key, value) => value && query(key, value, (k, v) => ({ field: k, min: v })),
  },
  {
    value: "<",
    text: "lesser than",
    useInput: true,
    query: (key, value) => value && query(key, value, (k, v) => ({ field: k, max: v })),
  },
  {
    value: "∃",
    text: "exists",
    useInput: false,
    query: (key) =>
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
    query: (key, value) =>
      value &&
      query(key, value, (k, v) => ({ field: k.replace(/\.keyword$/, ""), wildcard: `*${v}*` })),
  },
  {
    value: "!*",
    text: "does not contains",
    useInput: true,
    query: (key, value) =>
      value &&
      query(
        key,
        value,
        (k, v) => ({
          must_not: { disjuncts: [{ field: k.replace(/\.keyword$/, ""), wildcard: `*${v}*` }] },
        }),
        "must"
      ),
  },
  {
    value: "^",
    text: "start with",
    useInput: true,
    query: (key, value) =>
      value &&
      query(key, value, (k, v) => ({ field: k.replace(/\.keyword$/, ""), wildcard: `${v}*` })),
  },
];

export const defaultCombinators = [
  { value: "AND", text: "AND" },
  { value: "OR", text: "OR" },
];

export function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
export function withUniqueKey(rules) {
  return rules.map((r) => ({ ...r, key: uuidv4() }));
}
