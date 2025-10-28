import React from "react";
import { Antfly, AnswerBox, Results } from "../src";
import { url, tableName } from "./utils";

export default {
  title: "AnswerBox",
  component: AnswerBox,
};

export const Basic = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Basic AnswerBox</h1>
      <p>Type a question and click Submit or press Enter to execute the query.</p>
      <pre>{`<AnswerBox id="question" fields={["TICO", "AUTR"]} />`}</pre>
      <AnswerBox id="question" fields={["TICO", "AUTR"]} />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              <strong>{s.TICO}</strong> - {s.AUTR}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const WithCustomPlaceholder = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>AnswerBox with Custom Placeholder</h1>
      <pre>{`<AnswerBox
  id="question"
  fields={["TICO"]}
  placeholder="Ask about books..."
/>`}</pre>
      <AnswerBox id="question" fields={["TICO"]} placeholder="Ask about books..." />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              {s.TICO}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const WithCustomButtonLabel = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>AnswerBox with Custom Button Label</h1>
      <pre>{`<AnswerBox
  id="question"
  fields={["AUTR"]}
  buttonLabel="Search"
/>`}</pre>
      <AnswerBox id="question" fields={["AUTR"]} buttonLabel="Search" />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              {s.AUTR}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const WithInitialValue = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>AnswerBox with Initial Value</h1>
      <pre>{`<AnswerBox
  id="question"
  fields={["TICO"]}
  initialValue="science fiction"
/>`}</pre>
      <AnswerBox id="question" fields={["TICO"]} initialValue="science fiction" />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              {s.TICO}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const WithOnSubmitCallback = () => {
  const [lastSubmitted, setLastSubmitted] = React.useState<string>("");

  return (
    <Antfly url={url} table={tableName}>
      <h1>AnswerBox with onSubmit Callback</h1>
      <p>Last submitted: <strong>{lastSubmitted || "(none)"}</strong></p>
      <pre>{`<AnswerBox
  id="question"
  fields={["TICO"]}
  onSubmit={(value) => setLastSubmitted(value)}
/>`}</pre>
      <AnswerBox
        id="question"
        fields={["TICO"]}
        onSubmit={(value) => setLastSubmitted(value)}
      />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              {s.TICO}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const WithCustomQuery = () => {
  const customQuery = (query?: string) => {
    if (!query) {
      return { match_all: {} };
    }
    return {
      disjuncts: [
        { match: query, field: "TICO" },
        { match: query, field: "AUTR" },
      ],
    };
  };

  return (
    <Antfly url={url} table={tableName}>
      <h1>AnswerBox with Custom Query Function</h1>
      <p>Searches both TICO and AUTR fields</p>
      <pre>{`const customQuery = (query) => ({
  disjuncts: [
    { match: query, field: "TICO" },
    { match: query, field: "AUTR" }
  ]
});

<AnswerBox id="question" customQuery={customQuery} />`}</pre>
      <AnswerBox id="question" customQuery={customQuery} />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              <strong>{s.TICO}</strong> - {s.AUTR}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};

export const StyledExample = () => {
  return (
    <Antfly url={url} table={tableName}>
      <h1>Styled AnswerBox Example</h1>
      <style>{`
        .react-af-answerbox form {
          display: flex;
          gap: 10px;
          margin: 20px 0;
        }
        .react-af-answerbox input {
          flex: 1;
          padding: 12px;
          border: 2px solid #4a90e2;
          border-radius: 8px;
          font-size: 16px;
        }
        .react-af-answerbox input:focus {
          outline: none;
          border-color: #357abd;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }
        .react-af-answerbox button {
          padding: 12px 24px;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .react-af-answerbox button:hover:not(:disabled) {
          background: #357abd;
        }
        .react-af-answerbox button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
      <AnswerBox
        id="question"
        fields={["TICO"]}
        placeholder="Ask a question..."
        buttonLabel="Get Answer"
      />
      <Results
        id="result"
        items={(data) =>
          data.map(({ _source: s, _id }) => (
            <div key={_id} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
              {s.TICO}
            </div>
          ))
        }
        pagination={() => <></>}
      />
    </Antfly>
  );
};
