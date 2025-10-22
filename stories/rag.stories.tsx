import React from "react";
import { Antfly, AnswerBox, RAGResults, Results, ModelConfig } from "../src";
import { url } from "./utils";

export default {
  title: "RAG (Retrieval-Augmented Generation)",
  component: RAGResults,
};

// Mock summarizer configuration - replace with your actual config
const mockSummarizer: ModelConfig = {
  provider: "openai",
  model: "gpt-4",
  api_key: process.env.OPENAI_API_KEY || "your-api-key-here",
};

export const BasicRAG = () => {
  return (
    <Antfly url={url}>
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
    <Antfly url={url}>
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
    <Antfly url={url}>
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
    <Antfly url={url}>
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
    <Antfly url={url}>
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
  return (
    <Antfly url={url}>
      <h1>Styled RAG Interface</h1>
      <style>{`
        .rag-container {
          max-width: 800px;
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
        .react-af-rag-results {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .react-af-rag-summary {
          line-height: 1.8;
          color: #333;
          font-size: 16px;
        }
        .react-af-rag-streaming {
          color: #4a90e2;
          font-weight: bold;
        }
        .react-af-rag-citations {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
        }
        .react-af-rag-citations summary {
          cursor: pointer;
          font-weight: 600;
          color: #4a90e2;
        }
        .react-af-rag-citations li {
          margin: 15px 0;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        .react-af-rag-citation-content {
          margin-top: 8px;
          padding: 8px;
          background: white;
          border-left: 3px solid #4a90e2;
          font-size: 14px;
          color: #666;
        }
        .react-af-rag-error {
          padding: 16px;
          background: #fee;
          border-left: 4px solid #f44;
          border-radius: 4px;
        }
        .react-af-rag-empty {
          padding: 24px;
          text-align: center;
          color: #999;
          font-style: italic;
        }
      `}</style>

      <div className="rag-container">
        <AnswerBox
          id="question"
          fields={["TICO", "AUTR"]}
          placeholder="Ask me anything about the books..."
          buttonLabel="Get AI Answer"
        />

        <RAGResults
          id="rag-answer"
          answerBoxId="question"
          summarizer={mockSummarizer}
          withCitations={true}
          systemPrompt="You are a knowledgeable librarian. Provide helpful, detailed answers about books."
        />
      </div>
    </Antfly>
  );
};

export const MultipleLanguageModels = () => {
  const gpt4Summarizer: ModelConfig = {
    provider: "openai",
    model: "gpt-4",
    api_key: process.env.OPENAI_API_KEY || "your-api-key",
  };

  const claudeSummarizer: ModelConfig = {
    provider: "anthropic",
    model: "claude-3-sonnet-20240229",
    api_key: process.env.ANTHROPIC_API_KEY || "your-api-key",
  };

  return (
    <Antfly url={url}>
      <h1>Compare Different Language Models</h1>
      <p>See how different models respond to the same question.</p>

      <AnswerBox id="question" fields={["TICO", "AUTR"]} placeholder="Ask a question..." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
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
