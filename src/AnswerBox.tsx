import React, { ReactNode } from "react";
import QueryBox from "./QueryBox";

/**
 * @deprecated Use QueryBox with mode="submit" instead.
 * AnswerBox is maintained for backward compatibility.
 */
export interface AnswerBoxProps {
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
  buttonLabel?: string;
  onSubmit?: (value: string) => void;
  onInputChange?: (value: string) => void;
  onEscape?: (clearInput: () => void) => boolean;
}

/**
 * @deprecated Use QueryBox with mode="submit" instead.
 *
 * AnswerBox is a legacy component maintained for backward compatibility.
 * For new code, use QueryBox with AnswerResults:
 *
 * @example
 * ```tsx
 * <QueryBox id="answer" mode="submit" buttonLabel="Ask" />
 * <AnswerResults
 *   searchBoxId="answer"
 *   generator={{...}}
 * />
 * ```
 */
export default function AnswerBox({
  id,
  initialValue,
  placeholder,
  children,
  buttonLabel = "Submit",
  onSubmit,
  onInputChange,
  onEscape,
  // Legacy props - ignored in favor of AnswerResults configuration
  customQuery: _customQuery, // eslint-disable-line @typescript-eslint/no-unused-vars
  fields: _fields, // eslint-disable-line @typescript-eslint/no-unused-vars
  semanticIndexes: _semanticIndexes, // eslint-disable-line @typescript-eslint/no-unused-vars
  limit: _limit, // eslint-disable-line @typescript-eslint/no-unused-vars
  table: _table, // eslint-disable-line @typescript-eslint/no-unused-vars
  filterQuery: _filterQuery, // eslint-disable-line @typescript-eslint/no-unused-vars
  exclusionQuery: _exclusionQuery, // eslint-disable-line @typescript-eslint/no-unused-vars
}: AnswerBoxProps) {
  return (
    <QueryBox
      id={id}
      mode="submit"
      initialValue={initialValue}
      placeholder={placeholder}
      buttonLabel={buttonLabel}
      onSubmit={onSubmit}
      onInputChange={onInputChange}
      onEscape={onEscape}
    >
      {children}
    </QueryBox>
  );
}
