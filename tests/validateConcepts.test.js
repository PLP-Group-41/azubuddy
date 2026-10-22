import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const CONCEPTS_DIR = path.join(process.cwd(), 'concepts');

const REQUIRED_STRING_FIELDS = [
  'id',
  'name',
  'domain',
  'plain_english',
  'common_wrong_answer',
  'correction'
];

const VALID_DOMAINS = ['concepts', 'architecture', 'management'];

describe('Concept files', () => {
  const files = fs.readdirSync(CONCEPTS_DIR)
    .filter(file => file.endsWith('.json') && file !== '_schema.json');

  it('has at least one concept', () => {
    assert.ok(files.length > 0, 'No concept JSON files found');
  });

  for (const file of files) {
    describe(file, () => {
      const concept = JSON.parse(
        fs.readFileSync(path.join(CONCEPTS_DIR, file), 'utf8')
      );

      for (const field of REQUIRED_STRING_FIELDS) {
        it(`has a valid ${field}`, () => {
          assert.strictEqual(typeof concept[field], 'string');
          assert.ok(concept[field].trim().length > 0);
        });
      }

      it('has a valid domain', () => {
        assert.ok(VALID_DOMAINS.includes(concept.domain));
      });

      it('has at least two African examples', () => {
        assert.ok(Array.isArray(concept.african_examples));
        assert.ok(concept.african_examples.length >= 2);
      });

      it('has two or three follow-ups', () => {
        assert.ok(Array.isArray(concept.follow_ups));
        assert.ok(concept.follow_ups.length >= 2);
        assert.ok(concept.follow_ups.length <= 3);
      });
    });
  }
});
