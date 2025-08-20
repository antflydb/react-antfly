export function customQuery(query) {
  if (!query) {
    return { match_all: {} };
  }
  return { disjuncts: [{ match: query, field: "TICO" }] };
}

export function customQueryMovie(query) {
  if (!query) {
    return { match_all: {} };
  }
  return {
    should: [
      {
        disjuncts: [
          { match: query, field: "original_title" },
          { match: query, field: "overview" },
        ],
      },
      { disjuncts: [{ prefix: query, field: "original_title" }] },
    ],
  };
}

export const url = "http://localhost:8080/table/example";
