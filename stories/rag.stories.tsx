import { Antfly, AnswerBox, RAGResults, Results, GeneratorConfig } from "../src";
import { url, tableName } from "./utils";
import { Streamdown } from "streamdown";

export default {
  title: "RAG (Retrieval-Augmented Generation)",
  component: RAGResults,
};

// Mock summarizer configuration - replace with your actual config
const mockSummarizer: GeneratorConfig = {
  provider: "ollama",
  model: "gemma3:4b",
  // provider: "openai",
  // model: "gpt-4",
  // api_key: import.meta.env.VITE_OPENAI_API_KEY || "your-api-key-here",
};

export const BasicRAG = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Basic RAG Example</h1>
      <p>Ask a question and get an AI-generated summary based on search results.</p>
      <pre>{`<AnswerBox id="question" fields={["TICO", "AUTR"]} />
<RAGResults
  id="rag-answer"
  answerBoxId="question"
  summarizer={mockSummarizer}
/>`}</pre>

      <AnswerBox id="question" fields={["TICO", "AUTR"]} placeholder="Ask a question..." />

      <div style={{ marginTop: "20px" }}>
        <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
      </div>
    </Antfly>
  );
};

/**
 * @deprecated This example uses deprecated props (withCitations, showCitations).
 * Citations are now inline in the markdown summary using [doc_id ...] format.
 * See StyledRAGExample for how to parse and display inline citations.
 */
export const WithCitations = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>RAG with Inline Citations</h1>
      <p>Citations are now embedded inline in the summary text using [doc_id ...] format.</p>
      <p style={{ color: "#666", fontSize: "14px" }}>
        <strong>Note:</strong> The <code>withCitations</code> and <code>showCitations</code> props
        are deprecated. See the "Styled RAG Example" story for how to parse inline citations.
      </p>
      <pre>{`<AnswerBox id="question" fields={["TICO", "AUTR"]} />
<RAGResults
  id="rag-answer"
  answerBoxId="question"
  summarizer={mockSummarizer}
/>
// Citations are automatically inline in the summary`}</pre>

      <AnswerBox
        id="question"
        fields={["TICO", "AUTR"]}
        placeholder="Ask a question to see inline citations..."
      />

      <div style={{ marginTop: "20px" }}>
        <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
      </div>
    </Antfly>
  );
};

export const WithSystemPrompt = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>RAG with Custom System Prompt</h1>
      <p>Guide the AI's behavior with a custom system prompt.</p>
      <pre>{`<AnswerBox id="question" fields={["TICO"]} />
<RAGResults
  id="rag-answer"
  answerBoxId="question"
  summarizer={mockSummarizer}
  systemPrompt="You are a literary expert. Provide concise, scholarly answers."
/>`}</pre>

      <AnswerBox id="question" fields={["TICO"]} placeholder="Ask about literature..." />

      <div style={{ marginTop: "20px" }}>
        <RAGResults
          id="rag-answer"
          answerBoxId="question"
          summarizer={mockSummarizer}
          systemPrompt="You are a literary expert. Provide concise, scholarly answers about books and authors."
        />
      </div>
    </Antfly>
  );
};

export const WithCustomRendering = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>RAG with Custom Rendering</h1>
      <p>Customize how the AI summary is displayed. Parse inline citations yourself!</p>
      <pre>{`<RAGResults
  id="rag-answer"
  answerBoxId="question"
  summarizer={mockSummarizer}
  renderSummary={(summary, isStreaming) => (
    <div style={{
      padding: "20px",
      background: "#f5f5f5",
      borderRadius: "8px"
    }}>
      <h3>AI Answer {isStreaming && "⏳"}</h3>
      <p>{summary}</p>
      {/* Parse [doc_id ...] from summary text as needed */}
    </div>
  )}
/>`}</pre>

      <AnswerBox id="question" fields={["TICO", "AUTR"]} placeholder="Ask a question..." />

      <div style={{ marginTop: "20px" }}>
        <RAGResults
          id="rag-answer"
          answerBoxId="question"
          summarizer={mockSummarizer}
          renderSummary={(summary, isStreaming) => (
            <div
              style={{
                padding: "20px",
                background: "#f5f5f5",
                borderRadius: "8px",
                border: "2px solid #e0e0e0",
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                AI Answer {isStreaming && <span style={{ color: "#4a90e2" }}>⏳</span>}
              </h3>
              <p style={{ lineHeight: 1.6 }}>{summary || "No answer yet..."}</p>
              <div style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
                <em>Citations are inline in the text above (look for [doc_id ...])</em>
              </div>
            </div>
          )}
        />
      </div>
    </Antfly>
  );
};

export const RAGWithSearchResults = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>RAG + Traditional Search Results</h1>
      <p>
        Combine AI-generated summaries with traditional search results for the best of both worlds.
      </p>
      <pre>{`<AnswerBox id="question" fields={["TICO", "AUTR"]} />

{/* AI Summary with inline citations */}
<RAGResults
  id="rag-answer"
  answerBoxId="question"
  summarizer={mockSummarizer}
/>

{/* Traditional Results */}
<Results
  id="search-results"
  items={(data) => data.map(hit => ...)}
/>`}</pre>

      <AnswerBox
        id="question"
        fields={["TICO", "AUTR"]}
        placeholder="Ask a question..."
        buttonLabel="Search & Summarize"
      />

      <div style={{ marginTop: "20px" }}>
        <h2>AI Summary</h2>
        <RAGResults id="rag-answer" answerBoxId="question" summarizer={mockSummarizer} />
      </div>

      <div style={{ marginTop: "40px" }}>
        <h2>Search Results</h2>
        <Results
          id="search-results"
          items={(data) =>
            data.map(({ _source: s, _id, _score }) => (
              <div
                key={_id}
                style={{
                  padding: "15px",
                  borderBottom: "1px solid #e0e0e0",
                  marginBottom: "10px",
                }}
              >
                <h4 style={{ margin: "0 0 8px 0" }}>{String(s?.TICO)}</h4>
                <p style={{ margin: "0 0 5px 0", color: "#666" }}>{String(s?.AUTR)}</p>
                <small style={{ color: "#999" }}>Score: {_score?.toFixed(2)}</small>
              </div>
            ))
          }
          pagination={() => <></>}
        />
      </div>
    </Antfly>
  );
};

export const StyledRAGExample = () => {
  // Helper function to parse summary text and convert [doc_id X] to clickable links
  return (
    <Antfly url={url} table={tableName}>
      <h1>Styled RAG Interface with Streamdown.ai</h1>
      <p style={{ marginBottom: "20px", fontSize: "16px", lineHeight: "1.6" }}>
        This example demonstrates a fully-styled RAG interface using{" "}
        <a href="https://streamdown.ai/" target="_blank" rel="noopener noreferrer">
          Streamdown.ai
        </a>{" "}
        for rich markdown rendering (code highlighting, math, GFM) with interactive citations that
        scroll to source documents.
      </p>
      <style>{`
        .rag-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        .react-af-answerbox form {
          display: flex;
          gap: 10px;
          margin: 20px 0;
        }
        .react-af-answerbox input {
          flex: 1;
          padding: 14px;
          border: 2px solid #4a90e2;
          border-radius: 8px;
          font-size: 16px;
        }
        .react-af-answerbox button {
          padding: 14px 28px;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        .react-af-answerbox button:hover:not(:disabled) {
          background: #357abd;
        }
        .rag-summary-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }
        .rag-summary-text {
          line-height: 1.8;
          color: #333;
          font-size: 16px;
        }
        .rag-inline-citation-link {
          color: #4a90e2;
          text-decoration: none;
          font-weight: 600;
          padding: 1px 4px;
          border-radius: 3px;
          transition: background 0.2s;
        }
        .rag-inline-citation-link:hover {
          background: #e8f4ff;
          text-decoration: underline;
        }
        .rag-streaming-indicator {
          color: #4a90e2;
          font-weight: bold;
        }
        .rag-citations {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
        }
        .rag-citations h3 {
          font-size: 18px;
          color: #4a90e2;
          margin-bottom: 12px;
        }
        .rag-citation-item {
          margin: 10px 0;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .rag-citation-link {
          color: #4a90e2;
          text-decoration: none;
          font-weight: 600;
        }
        .rag-citation-link:hover {
          text-decoration: underline;
        }
        .rag-citation-quote {
          margin-top: 8px;
          padding: 8px;
          background: white;
          border-left: 3px solid #4a90e2;
          font-size: 14px;
          color: #666;
          font-style: italic;
        }
        .rag-hits-section {
          margin-top: 24px;
        }
        .rag-hits-section h2 {
          font-size: 20px;
          color: #333;
          margin-bottom: 16px;
        }
        .rag-hit {
          padding: 20px;
          margin-bottom: 16px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #4a90e2;
          scroll-margin-top: 20px;
        }
        .rag-hit:target {
          background: #f0f8ff;
          box-shadow: 0 2px 12px rgba(74, 144, 226, 0.3);
        }
        .rag-hit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .rag-hit-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }
        .rag-hit-score {
          font-size: 12px;
          color: #999;
          background: #f5f5f5;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .rag-hit-content {
          color: #666;
          line-height: 1.6;
        }
        .rag-error {
          padding: 16px;
          background: #fee;
          border-left: 4px solid #f44;
          border-radius: 4px;
        }
        .rag-empty {
          padding: 24px;
          text-align: center;
          color: #999;
          font-style: italic;
        }
      `}</style>

      <div className="rag-container">
        <AnswerBox
          id="question"
          semanticIndexes={["tico_gemma"]}
          placeholder="Ask me anything about the books..."
          buttonLabel="Get AI Answer"
          fields={["TICO", "AUTR", "DESC"]}
        />

        <RAGResults
          id="rag-answer"
          answerBoxId="question"
          fields={["TICO", "AUTR", "DESC"]}
          summarizer={mockSummarizer}
          showHits={true}
          systemPrompt="You are a knowledgeable librarian. Provide helpful, detailed answers about books."
          renderSummary={(summary, isStreaming, hits) => {
            // Convert [doc_id X] citations to markdown links before passing to Streamdown
            const convertCitationsToMarkdownLinks = (text: string) => {
              return text.replace(/\[doc_id\s+(\w+)\]/g, (match, docId) => {
                return `[[${docId}]](#hit-${docId})`;
              });
            };

            const summaryWithLinks = summary ? convertCitationsToMarkdownLinks(summary) : "";

            // Handle click events on citation links to scroll instead of navigate
            const handleCitationClick = (e: React.MouseEvent<HTMLDivElement>) => {
              const target = e.target as HTMLElement;
              if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#hit-")) {
                e.preventDefault();
                const id = target.getAttribute("href")?.substring(1);
                if (id) {
                  const element = document.getElementById(id);
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                    element.style.transition = "background 0.3s";
                    element.style.background = "#f0f8ff";
                    setTimeout(() => {
                      element.style.background = "";
                    }, 2000);
                  }
                }
              }
            };

            return (
              <div>
                <div className="rag-summary-section">
                  {!summary && !isStreaming && (
                    <div className="rag-empty">
                      No results yet. Submit a question to get started.
                    </div>
                  )}
                  {summary && (
                    <div>
                      <div className="rag-summary-text" onClick={handleCitationClick}>
                        <Streamdown isAnimating={isStreaming}>{summaryWithLinks}</Streamdown>
                      </div>
                      <div
                        style={{
                          marginTop: "12px",
                          fontSize: "14px",
                          color: "#666",
                          fontStyle: "italic",
                        }}
                      >
                        💡 Tip: Click citation links (e.g., [19], [16]) to jump to source documents
                        below (powered by{" "}
                        <a href="https://streamdown.ai/" target="_blank" rel="noopener">
                          Streamdown.ai
                        </a>
                        )
                      </div>
                    </div>
                  )}
                </div>

                {hits && hits.length > 0 && (
                  <div className="rag-hits-section">
                    <h2>🔍 Search Results ({hits.length})</h2>
                    {hits.map((hit) => (
                      <div key={hit._id} id={`hit-${hit._id}`} className="rag-hit">
                        <div className="rag-hit-header">
                          <h3 className="rag-hit-title">
                            {String(hit._source?.TICO) || `Document ${hit._id}`}
                          </h3>
                          <span className="rag-hit-score">Score: {hit._score.toFixed(3)}</span>
                        </div>
                        <div className="rag-hit-content">
                          {hit._source?.AUTR ? (
                            <p>
                              <strong>Author:</strong> {String(hit._source?.AUTR)}
                            </p>
                          ) : null}
                          {hit._source?.DESC ? <p>{String(hit._source?.DESC)}</p> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>
    </Antfly>
  );
};

export const MultipleLanguageModels = () => {
  const gpt4Summarizer: GeneratorConfig = {
    provider: "openai",
    model: "gpt-4",
    api_key:
      (import.meta as { env?: Record<string, string> }).env?.VITE_OPENAI_API_KEY || "your-api-key",
  };

  const claudeSummarizer: GeneratorConfig = {
    provider: "openai" as "openai" | "ollama", // anthropic not yet supported in type
    model: "claude-3-sonnet-20240229",
    api_key:
      (import.meta as { env?: Record<string, string> }).env?.VITE_ANTHROPIC_API_KEY ||
      "your-api-key",
  };

  return (
    <Antfly url={url} table={tableName}>
      <h1>Compare Different Language Models</h1>
      <p>See how different models respond to the same question.</p>

      <AnswerBox id="question" fields={["TICO", "AUTR"]} placeholder="Ask a question..." />

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}
      >
        <div>
          <h3>GPT-4 Response</h3>
          <RAGResults id="rag-gpt4" answerBoxId="question" summarizer={gpt4Summarizer} />
        </div>
        <div>
          <h3>Claude Response</h3>
          <RAGResults id="rag-claude" answerBoxId="question" summarizer={claudeSummarizer} />
        </div>
      </div>
    </Antfly>
  );
};
