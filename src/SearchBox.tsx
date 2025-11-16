import React, { ReactNode } from "react";
import QueryBox from "./QueryBox";

/**
 * @deprecated Use QueryBox with mode="live" instead.
 * SearchBox is maintained for backward compatibility.
 */
export interface SearchBoxProps {
  customQuery?: (query?: string) => unknown;
  fields?: string[];
  id: string;
  initialValue?: string;
  placeholder?: string;
  semanticIndexes?: string[];
  limit?: number;
  table?: string;
  filterQuery?: Record<string, unknown>;
  exclusionQuery?: Record<string, unknown>;
  children?: ReactNode;
}

/**
 * @deprecated Use QueryBox with mode="live" instead.
 *
 * SearchBox is a legacy component maintained for backward compatibility.
 * For new code, use QueryBox with Results:
 *
 * @example
 * ```tsx
 * <QueryBox id="search" mode="live" />
 * <Results
 *   searchBoxId="search"
 *   fields={["title", "content"]}
 *   items={(data) => ...}
 * />
 * ```
 */
export default function SearchBox({
  id,
  initialValue,
  placeholder,
  children,
  // Legacy props - ignored in favor of Results configuration
  customQuery: _customQuery, // eslint-disable-line @typescript-eslint/no-unused-vars
  fields: _fields, // eslint-disable-line @typescript-eslint/no-unused-vars
  semanticIndexes: _semanticIndexes, // eslint-disable-line @typescript-eslint/no-unused-vars
  limit: _limit, // eslint-disable-line @typescript-eslint/no-unused-vars
  table: _table, // eslint-disable-line @typescript-eslint/no-unused-vars
  filterQuery: _filterQuery, // eslint-disable-line @typescript-eslint/no-unused-vars
  exclusionQuery: _exclusionQuery, // eslint-disable-line @typescript-eslint/no-unused-vars
}: SearchBoxProps) {
  return (
    <QueryBox
      id={id}
      mode="live"
      initialValue={initialValue}
      placeholder={placeholder}
    >
      {children}
    </QueryBox>
  );
}
