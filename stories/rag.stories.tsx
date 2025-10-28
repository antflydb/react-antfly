import { Antfly, AnswerBox, RAGResults, Results, ModelConfig } from "../src";
import { url, tableName } from "./utils";

export default {
  title: "RAG (Retrieval-Augmented Generation)",
  component: RAGResults,
};

// Mock summarizer configuration - replace with your actual config
const mockSummarizer: ModelConfig = {
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

export const WithCitations = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>RAG with Citations</h1>
      <p>Get an AI summary with citations from source documents.</p>
      <pre>{`<AnswerBox id="question" fields={["TICO", "AUTR"]} />
<RAGResults
  id="rag-answer"
  answerBoxId="question"
  summarizer={mockSummarizer}
  withCitations={true}
  showCitations={true}
/>`}</pre>

      <AnswerBox
        id="question"
        fields={["TICO", "AUTR"]}
        placeholder="Ask a question to see citations..."
      />

      <div style={{ marginTop: "20px" }}>
        <RAGResults
          id="rag-answer"
          answerBoxId="question"
          summarizer={mockSummarizer}
          withCitations={true}
          showCitations={true}
        />
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
      <p>Customize how the AI summary is displayed.</p>
      <pre>{`<RAGResults
  id="rag-answer"
  answerBoxId="question"
  summarizer={mockSummarizer}
  renderSummary={(summary, isStreaming, citations) => (
    <div style={{
      padding: "20px",
      background: "#f5f5f5",
      borderRadius: "8px"
    }}>
      <h3>AI Answer {isStreaming && "⏳"}</h3>
      <p>{summary}</p>
      {citations && citations.length > 0 && (
        <div>
          <strong>Sources: {citations.length}</strong>
        </div>
      )}
    </div>
  )}
/>`}</pre>

      <AnswerBox id="question" fields={["TICO", "AUTR"]} placeholder="Ask a question..." />

      <div style={{ marginTop: "20px" }}>
        <RAGResults
          id="rag-answer"
          answerBoxId="question"
          summarizer={mockSummarizer}
          withCitations={true}
          renderSummary={(summary, isStreaming, citations) => (
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
              {citations && citations.length > 0 && (
                <div style={{ marginTop: "15px", fontSize: "14px", color: "#666" }}>
                  <strong>📚 Sources: {citations.length} documents</strong>
                </div>
              )}
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

{/* AI Summary */}
<RAGResults
  id="rag-answer"
  answerBoxId="question"
  summarizer={mockSummarizer}
  withCitations={true}
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
        <RAGResults
          id="rag-answer"
          answerBoxId="question"
          summarizer={mockSummarizer}
          withCitations={true}
        />
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
                <h4 style={{ margin: "0 0 8px 0" }}>{s.TICO}</h4>
                <p style={{ margin: "0 0 5px 0", color: "#666" }}>{s.AUTR}</p>
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
  const parseSummaryWithLinks = (text: string) => {
    if (!text) return null;

    // Regex to match [doc_id <ID>] or legacy [<ID>] format
    const citationRegex = /\[(?:doc_id\s+)?(\w+)\]/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = citationRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add clickable link for the citation - only the number is clickable, not the brackets
      const docId = match[1];
      parts.push('[');
      parts.push(
        <a
          key={`cite-${match.index}-${docId}`}
          href={`#hit-${docId}`}
          className="rag-inline-citation-link"
          onClick={(e) => {
            e.preventDefault();
            const target = document.getElementById(`hit-${docId}`);
            if (target) {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // Add temporary highlight
              target.style.transition = 'background 0.3s';
              target.style.background = '#f0f8ff';
              setTimeout(() => {
                target.style.background = '';
              }, 2000);
            }
          }}
        >
          {docId}
        </a>
      );
      parts.push(']');

      lastIndex = citationRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <Antfly url={url} table={tableName}>
      <h1>Styled RAG Interface with Streaming</h1>
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
          withCitations={true}
          showHits={true}
          systemPrompt="You are a knowledgeable librarian. Provide helpful, detailed answers about books."
          renderSummary={(summary, isStreaming, citations, hits) => {
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
                      <div className="rag-summary-text">
                        {parseSummaryWithLinks(summary)}
                        {isStreaming && <span className="rag-streaming-indicator"> ...</span>}
                      </div>
                    {citations && citations.length > 0 && (
                      <div className="rag-citations">
                        <h3>📚 Citations ({citations.length})</h3>
                        {citations.map((citation, idx) => (
                          <div key={citation.id || idx} className="rag-citation-item">
                            <a
                              href={`#hit-${citation.id}`}
                              className="rag-citation-link"
                              onClick={(e) => {
                                e.preventDefault();
                                const target = document.getElementById(`hit-${citation.id}`);
                                if (target) {
                                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  // Add temporary highlight
                                  target.style.transition = 'background 0.3s';
                                  target.style.background = '#f0f8ff';
                                  setTimeout(() => {
                                    target.style.background = '';
                                  }, 2000);
                                }
                              }}
                            >
                              [{idx + 1}] Document {citation.id}
                            </a>
                            <div className="rag-citation-quote">"{citation.quote}"</div>
                          </div>
                        ))}
                      </div>
                    )}
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
                          {hit._source?.TICO || `Document ${hit._id}`}
                        </h3>
                        <span className="rag-hit-score">Score: {hit._score.toFixed(3)}</span>
                      </div>
                      <div className="rag-hit-content">
                        {hit._source?.AUTR && <p><strong>Author:</strong> {hit._source.AUTR}</p>}
                        {hit._source?.DESC && <p>{hit._source.DESC}</p>}
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
  const gpt4Summarizer: ModelConfig = {
    provider: "openai",
    model: "gpt-4",
    api_key: import.meta.env.VITE_OPENAI_API_KEY || "your-api-key",
  };

  const claudeSummarizer: ModelConfig = {
    provider: "anthropic",
    model: "claude-3-sonnet-20240229",
    api_key: import.meta.env.VITE_ANTHROPIC_API_KEY || "your-api-key",
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
