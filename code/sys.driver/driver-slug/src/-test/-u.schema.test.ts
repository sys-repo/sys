import { describe, expect, it } from '../-test.ts';
import { formatSchemaReason } from '../m.client/u.schema.ts';

describe('formatSchemaReason', () => {
  it('includes non-empty path followed by message', () => {
    const result = formatSchemaReason([
      { path: 'assets/0/href', message: 'Expected string' },
    ]);
    expect(result).to.eql('assets/0/href: Expected string');
  });

  it('handles array paths and joins them with /', () => {
    const result = formatSchemaReason([
      { path: ['assets', '0', 'hash'], message: 'Missing hash' },
    ]);
    expect(result).to.eql('assets/0/hash: Missing hash');
  });

  it('omits the path when it is empty', () => {
    const result = formatSchemaReason([{ path: '', message: 'Bad' }]);
    expect(result).to.eql('Bad');
  });
});
