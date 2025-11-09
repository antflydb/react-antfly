# React Antfly

[![Version](https://img.shields.io/npm/v/@antfly/react-antfly.svg)](https://npmjs.org/package/@antfly/react-antfly)
[![Downloads](https://img.shields.io/npm/dt/@antfly/react-antfly.svg)](https://npmjs.org/package/@antfly/react-antfly)
[![License](https://img.shields.io/npm/l/@antfly/react-antfly.svg)](https://github.com/antflydb/react-antfly/blob/master/package.json)

UI components for React + Antfly. Create search applications using declarative components.
## Usage
**[Documentation about Antfly](https://docs.antfly.io).**

```jsx
const MySearchComponent = () => (
  <Antfly url="http://<antfly_url>/table/movies">
    <SearchBox id="mainSearch" fields={["title"]} />
    <Autosuggest id="autosuggest" fields={["title"]} returnFields={["title"]} />
    <Facet id="actors" fields={["actors"]} />
    <Facet id="releasedYear" fields={["releasedYear"]} />
    <Results
      id="results"
      items={data =>
        // Map on result hits and display whatever you want.
        data.map(item => <MyCardItem key={item._id} source={item._source} />)
      }
    />
  </Antfly>
);
```

## Install

```
npm i @antfly/components
```

## Develop

### Backend Setup

Before using the React components, you need to create a table in your Antfly instance with the appropriate schema. Here's an example using `antflycli` to create the "example" table used in our storybook:

```bash
antflycli table create --table example \
  --schema '{
    "key": "_id",
    "default_type": "default",
    "document_schemas": {
      "default": {
        "key": "_id",
        "schema": {
          "type": "object",
          "properties": {
            "_id": {"type": "string"},
            "TICO": {
              "type": "string",
              "x-antfly-types": ["text", "keyword", "search_as_you_type"]
            },
            "AUTR": {
              "type": "string",
              "x-antfly-types": ["text", "keyword", "search_as_you_type"]
            },
            "DOMN": {"type": "string"},
            "DESC": {"type": "string"},
            "DMIS": {"type": "string", "format": "date"},
            "DMAJ": {"type": "string", "format": "date"}
          }
        }
      }
    }
  }' \
  --index '{
    "name": "tico_embeddings",
    "field": "TICO",
    "embedder": {
      "provider": "ollama",
      "model": "nomic-embed-text"
    }
  }'
```

This creates a table with:
- **TICO** (title) and **AUTR** (author): Multi-type fields with full-text search, keyword faceting (`AUTR__keyword`, `TICO__keyword`), and autocomplete (`AUTR__2gram`, `TICO__2gram`)
- **DOMN** (domain), **DESC** (description): Text fields for categorization and content
- **DMIS**, **DMAJ**: Date fields for sorting
- **tico_embeddings**: Vector index for semantic search using Ollama embeddings

You can then load sample data from `storybook-testdata.jsonl` using:

```bash
antflycli load --table example --file storybook-testdata.jsonl --id-field _id
```

### Run Storybook

```bash
npm run storybook
```

## Main features

- Released under **MIT licence**.
- Each component is built with React and is **customisable**. Not too much extra features nor magic.
- It comes with **no style** so it's the developers responsibility to implement their own.
- **35.32KB gzipped** for the whole lib, compatible with old browsers: >0.03% usage.

## Documentation

- **[Answer Feedback](docs/feedback.md)** - Collect user ratings and comments on AI-generated answers

## Acknowledgements

This work is based off the awesome work by [react-elasticsearch](https://github.com/betagouv/react-elasticsearch).


## Contributing

Open issues and PR here: https://github.com/antflydb/react-antfly
