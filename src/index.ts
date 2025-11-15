import "./style.css";
import Antfly from "./Antfly";
import Results from "./Results";
import QueryBox from "./QueryBox";
import SearchBox from "./SearchBox";
import Facet from "./Facet";
import Pagination from "./Pagination";
import Listener from "./Listener";
import ActiveFilters from "./ActiveFilters";
import QueryBuilder from "./QueryBuilder/QueryBuilder";
import CustomWidget from "./CustomWidget";
import Autosuggest, { AutosuggestResults, AutosuggestFacets } from "./Autosuggest";
import AnswerBox from "./AnswerBox";
import RAGBox from "./RAGBox";
import RAGResults, { useRAGResultsContext } from "./RAGResults";
import AnswerResults from "./AnswerResults";
import { useAnswerResultsContext } from "./AnswerResultsContext";
import AnswerFeedback from "./AnswerFeedback";
import {
  renderThumbsUpDown,
  renderStars,
  renderNumeric,
} from "./feedback-renderers";
import {
  fromUrlQueryString,
  toUrlQueryString,
  multiquery,
  initializeAntflyClient,
  getAntflyClient,
  streamRAG,
  streamAnswer,
} from "./utils";
import {
  parseCitations,
  replaceCitations,
  renderAsMarkdownLinks,
  renderAsSequentialLinks,
  getCitedDocumentIds,
} from "./citations";

export {
  Antfly,
  Results,
  QueryBox,
  // Deprecated: Use QueryBox instead
  SearchBox,
  AnswerBox,
  RAGBox,
  Facet,
  Pagination,
  Listener,
  fromUrlQueryString,
  toUrlQueryString,
  ActiveFilters,
  QueryBuilder,
  CustomWidget,
  Autosuggest,
  AutosuggestResults,
  AutosuggestFacets,
  RAGResults,
  useRAGResultsContext,
  AnswerResults,
  useAnswerResultsContext,
  AnswerFeedback,
  renderThumbsUpDown,
  renderStars,
  renderNumeric,
  multiquery as msearch,
  initializeAntflyClient,
  getAntflyClient,
  streamRAG,
  streamAnswer,
  parseCitations,
  replaceCitations,
  renderAsMarkdownLinks,
  renderAsSequentialLinks,
  getCitedDocumentIds,
};

// Export types for users of the library
export type { AntflyProps } from "./Antfly";
export type { ResultsProps } from "./Results";
export type { QueryBoxProps } from "./QueryBox";
// Deprecated types: Use QueryBoxProps instead
export type { SearchBoxProps } from "./SearchBox";
export type { AnswerBoxProps } from "./AnswerBox";
export type { RAGBoxProps } from "./RAGBox";
export type { FacetProps } from "./Facet";
export type { PaginationProps } from "./Pagination";
export type { ActiveFiltersProps, ActiveFilter } from "./ActiveFilters";
export type { CustomWidgetProps } from "./CustomWidget";
export type { AutosuggestProps, AutosuggestResultsProps, AutosuggestFacetsProps } from "./Autosuggest";
export type { RAGResultsProps } from "./RAGResults";
export type { AnswerResultsProps } from "./AnswerResults";
export type { AnswerResultsContextValue } from "./AnswerResultsContext";
export type { AnswerFeedbackProps, FeedbackResult } from "./AnswerFeedback";
export type { QueryBuilderProps, QueryBuilderRule, FieldOption } from "./QueryBuilder/QueryBuilder";
export type { RuleProps } from "./QueryBuilder/Rule";
export type { Operator, Combinator } from "./QueryBuilder/utils";
export type { SharedState, SharedAction, Widget } from "./SharedContext";
export type { MultiqueryRequest, RAGCallbacks, AnswerCallbacks } from "./utils";
export type {
  RAGRequest,
  RAGResult,
  SummarizeResult,
  GeneratorConfig,
  AnswerAgentRequest,
  AnswerAgentResult,
} from "@antfly/sdk";
export type { Citation, CitationRenderOptions } from "./citations";
