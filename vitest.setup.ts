import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the @antfly/sdk module
vi.mock('@antfly/sdk', () => {
  return {
    AntflyClient: vi.fn(function() {
      this.multiquery = vi.fn(async function(queries) {
        // Return mock successful responses for each query
        return {
          responses: queries.map(() => ({
            status: 200,
            took: 1,
            hits: {
              hits: [
                {
                  _id: 'mock-doc-1',
                  _source: {
                    title: 'Mock Result 1',
                    description: 'Mock description',
                  },
                },
                {
                  _id: 'mock-doc-2',
                  _source: {
                    title: 'Mock Result 2',
                    description: 'Another mock',
                  },
                },
              ],
              total: 2,
            },
            facets: {},
          })),
        };
      });
    }),
  };
});
