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
yarn add @antfly/components
```

## Develop

You can test components with storybook (20+ examples).

```
npm run storybook
```

## Main features

- Released under **MIT licence**.
- Each component is built with React and is **customisable**. Not too much extra features nor magic.
- It comes with **no style** so it's the developers responsibility to implement their own.
- **35.32KB gzipped** for the whole lib, compatible with old browsers: >0.03% usage.

## Acknowledgements

This work is based off the awesome work by [react-elasticsearch](https://github.com/betagouv/react-elasticsearch).


## Contributing

Open issues and PR here: https://github.com/antflydb/react-antfly
