import "./style.css";
import Antfly from "./Antfly";
import Results from "./Results";
import QueryBox from "./QueryBox";
import Facet from "./Facet";
import Pagination from "./Pagination";
import Listener from "./Listener";
import ActiveFilters from "./ActiveFilters";
import CustomWidget from "./CustomWidget";
import Autosuggest, { AutosuggestResults, AutosuggestFacets } from "./Autosuggest";
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
  getCitedResourceIds,
} from "./citations";
import { useSearchHistory } from "./hooks/useSearchHistory";
import { useAnswerStream } from "./hooks/useAnswerStream";
import { useCitations } from "./hooks/useCitations";

export {
  Antfly,
  Results,
  QueryBox,
  Facet,
  Pagination,
  Listener,
  fromUrlQueryString,
  toUrlQueryString,
  ActiveFilters,
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
  getCitedResourceIds,
  useSearchHistory,
  useAnswerStream,
  useCitations,
};

// Export types for users of the library
export type { AntflyProps } from "./Antfly";
export type { ResultsProps } from "./Results";
export type { QueryBoxProps } from "./QueryBox";
export type { FacetProps } from "./Facet";
export type { PaginationProps } from "./Pagination";
export type { ActiveFiltersProps, ActiveFilter } from "./ActiveFilters";
export type { CustomWidgetProps } from "./CustomWidget";
export type { AutosuggestProps, AutosuggestResultsProps, AutosuggestFacetsProps } from "./Autosuggest";
export type { RAGResultsProps } from "./RAGResults";
export type { AnswerResultsProps } from "./AnswerResults";
export type { AnswerResultsContextValue } from "./AnswerResultsContext";
export type { AnswerFeedbackProps, FeedbackResult } from "./AnswerFeedback";
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
export type { SearchResult, SearchHistory, CitationMetadata } from "./hooks/useSearchHistory";
export type { QueryClassification } from "./hooks/useAnswerStream";
