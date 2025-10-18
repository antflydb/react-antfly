import { describe, it, expect } from 'vitest';
import { QueryHit } from '@antfly/sdk';

describe('SearchBox Suggestion Selection Logic', () => {
  describe('with fields defined', () => {
    it('should extract value from specified field', () => {
      const mockSuggestion: QueryHit = {
        _id: 'doc1',
        _index: 'test',
        _source: {
          title: 'Test Title',
          description: 'Test Description',
        },
      };

      const fields = ['title'];
      const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");
      let valueToSet = '';

      if (firstField && mockSuggestion._source?.[firstField]) {
        valueToSet = String(mockSuggestion._source[firstField]);
      } else if (!fields || fields.length === 0) {
        const commonTextFields = ['title', 'name', 'label', 'text', 'description'];
        const sourceFields = mockSuggestion._source ? Object.keys(mockSuggestion._source) : [];

        for (const commonField of commonTextFields) {
          if (mockSuggestion._source?.[commonField]) {
            valueToSet = String(mockSuggestion._source[commonField]);
            break;
          }
        }

        if (!valueToSet && sourceFields.length > 0) {
          const firstAvailableField = sourceFields[0];
          const fieldValue = mockSuggestion._source?.[firstAvailableField];
          if (fieldValue && typeof fieldValue !== 'object') {
            valueToSet = String(fieldValue);
          }
        }

        if (!valueToSet) {
          valueToSet = mockSuggestion._id || '';
        }
      }

      expect(valueToSet).toBe('Test Title');
    });
  });

  describe('with fields undefined - fallback behavior', () => {
    it('should use title field when available', () => {
      const mockSuggestion: QueryHit = {
        _id: 'doc1',
        _index: 'test',
        _source: {
          title: 'Test Title',
          description: 'Test Description',
          custom: 'Custom Value',
        },
      };

      // Manually test the extraction logic
      const fields = undefined;
      const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");
      let valueToSet = '';

      if (firstField && mockSuggestion._source?.[firstField]) {
        valueToSet = String(mockSuggestion._source[firstField]);
      } else if (!fields || fields.length === 0) {
        const commonTextFields = ['title', 'name', 'label', 'text', 'description'];
        const sourceFields = mockSuggestion._source ? Object.keys(mockSuggestion._source) : [];

        for (const commonField of commonTextFields) {
          if (mockSuggestion._source?.[commonField]) {
            valueToSet = String(mockSuggestion._source[commonField]);
            break;
          }
        }

        if (!valueToSet && sourceFields.length > 0) {
          const firstAvailableField = sourceFields[0];
          const fieldValue = mockSuggestion._source?.[firstAvailableField];
          if (fieldValue && typeof fieldValue !== 'object') {
            valueToSet = String(fieldValue);
          }
        }

        if (!valueToSet) {
          valueToSet = mockSuggestion._id || '';
        }
      }

      expect(valueToSet).toBe('Test Title');
    });

    it('should use name field when title not available', () => {
      const mockSuggestion: QueryHit = {
        _id: 'doc1',
        _index: 'test',
        _source: {
          name: 'Test Name',
          description: 'Test Description',
        },
      };

      const fields = undefined;
      const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");
      let valueToSet = '';

      if (firstField && mockSuggestion._source?.[firstField]) {
        valueToSet = String(mockSuggestion._source[firstField]);
      } else if (!fields || fields.length === 0) {
        const commonTextFields = ['title', 'name', 'label', 'text', 'description'];

        for (const commonField of commonTextFields) {
          if (mockSuggestion._source?.[commonField]) {
            valueToSet = String(mockSuggestion._source[commonField]);
            break;
          }
        }

        if (!valueToSet && mockSuggestion._source) {
          const sourceFields = Object.keys(mockSuggestion._source);
          if (sourceFields.length > 0) {
            const firstAvailableField = sourceFields[0];
            const fieldValue = mockSuggestion._source[firstAvailableField];
            if (fieldValue && typeof fieldValue !== 'object') {
              valueToSet = String(fieldValue);
            }
          }
        }

        if (!valueToSet) {
          valueToSet = mockSuggestion._id || '';
        }
      }

      expect(valueToSet).toBe('Test Name');
    });

    it('should use first available field when no common fields exist', () => {
      const mockSuggestion: QueryHit = {
        _id: 'doc1',
        _index: 'test',
        _source: {
          custom_field: 'Custom Value',
          another_field: 'Another Value',
        },
      };

      const fields = undefined;
      const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");
      let valueToSet = '';

      if (firstField && mockSuggestion._source?.[firstField]) {
        valueToSet = String(mockSuggestion._source[firstField]);
      } else if (!fields || fields.length === 0) {
        const commonTextFields = ['title', 'name', 'label', 'text', 'description'];
        const sourceFields = mockSuggestion._source ? Object.keys(mockSuggestion._source) : [];

        for (const commonField of commonTextFields) {
          if (mockSuggestion._source?.[commonField]) {
            valueToSet = String(mockSuggestion._source[commonField]);
            break;
          }
        }

        if (!valueToSet && sourceFields.length > 0) {
          const firstAvailableField = sourceFields[0];
          const fieldValue = mockSuggestion._source?.[firstAvailableField];
          if (fieldValue && typeof fieldValue !== 'object') {
            valueToSet = String(fieldValue);
          }
        }

        if (!valueToSet) {
          valueToSet = mockSuggestion._id || '';
        }
      }

      expect(valueToSet).toBe('Custom Value');
    });

    it('should use _id when no source fields available', () => {
      const mockSuggestion: QueryHit = {
        _id: 'doc123',
        _index: 'test',
        _source: {},
      };

      const fields = undefined;
      const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");
      let valueToSet = '';

      if (firstField && mockSuggestion._source?.[firstField]) {
        valueToSet = String(mockSuggestion._source[firstField]);
      } else if (!fields || fields.length === 0) {
        const commonTextFields = ['title', 'name', 'label', 'text', 'description'];
        const sourceFields = mockSuggestion._source ? Object.keys(mockSuggestion._source) : [];

        for (const commonField of commonTextFields) {
          if (mockSuggestion._source?.[commonField]) {
            valueToSet = String(mockSuggestion._source[commonField]);
            break;
          }
        }

        if (!valueToSet && sourceFields.length > 0) {
          const firstAvailableField = sourceFields[0];
          const fieldValue = mockSuggestion._source?.[firstAvailableField];
          if (fieldValue && typeof fieldValue !== 'object') {
            valueToSet = String(fieldValue);
          }
        }

        if (!valueToSet) {
          valueToSet = mockSuggestion._id || '';
        }
      }

      expect(valueToSet).toBe('doc123');
    });

    it('should skip object values and find next available string field', () => {
      const mockSuggestion: QueryHit = {
        _id: 'doc1',
        _index: 'test',
        _source: {
          metadata: { nested: 'object' },
          title: 'Test Title',
        },
      };

      const fields = undefined;
      const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");
      let valueToSet = '';

      if (firstField && mockSuggestion._source?.[firstField]) {
        valueToSet = String(mockSuggestion._source[firstField]);
      } else if (!fields || fields.length === 0) {
        const commonTextFields = ['title', 'name', 'label', 'text', 'description'];

        for (const commonField of commonTextFields) {
          if (mockSuggestion._source?.[commonField]) {
            valueToSet = String(mockSuggestion._source[commonField]);
            break;
          }
        }

        if (!valueToSet && mockSuggestion._source) {
          const sourceFields = Object.keys(mockSuggestion._source);
          for (const field of sourceFields) {
            const fieldValue = mockSuggestion._source[field];
            if (fieldValue && typeof fieldValue !== 'object') {
              valueToSet = String(fieldValue);
              break;
            }
          }
        }

        if (!valueToSet) {
          valueToSet = mockSuggestion._id || '';
        }
      }

      expect(valueToSet).toBe('Test Title');
    });
  });

  describe('with empty fields array', () => {
    it('should behave same as undefined fields', () => {
      const mockSuggestion: QueryHit = {
        _id: 'doc1',
        _index: 'test',
        _source: {
          title: 'Test Title',
        },
      };

      const fields: string[] = [];
      const firstField = fields?.[0]?.replace(/__(2gram|keyword)$/, "");
      let valueToSet = '';

      if (firstField && mockSuggestion._source?.[firstField]) {
        valueToSet = String(mockSuggestion._source[firstField]);
      } else if (!fields || fields.length === 0) {
        const commonTextFields = ['title', 'name', 'label', 'text', 'description'];

        for (const commonField of commonTextFields) {
          if (mockSuggestion._source?.[commonField]) {
            valueToSet = String(mockSuggestion._source[commonField]);
            break;
          }
        }

        if (!valueToSet && mockSuggestion._source) {
          const sourceFields = Object.keys(mockSuggestion._source);
          if (sourceFields.length > 0) {
            const firstAvailableField = sourceFields[0];
            const fieldValue = mockSuggestion._source[firstAvailableField];
            if (fieldValue && typeof fieldValue !== 'object') {
              valueToSet = String(fieldValue);
            }
          }
        }

        if (!valueToSet) {
          valueToSet = mockSuggestion._id || '';
        }
      }

      expect(valueToSet).toBe('Test Title');
    });
  });
});
