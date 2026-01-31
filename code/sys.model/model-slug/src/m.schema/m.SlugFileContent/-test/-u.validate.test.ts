import { describe, expect, it, Schema, type t } from '../../../-test.ts';
import { SlugFileContentSchema } from '../mod.ts';
import { validate } from '../u.validate.ts';

describe('SlugFileContent.validate', () => {
  const VALID_DOC: t.SlugFileContentDoc = {
    source: 'hello',
    hash: 'abc',
    contentType: 'text/markdown',
    frontmatter: { ref: 'crdt:test' },
  };

  it('API', () => {
    expect(SlugFileContentSchema.validate).to.equal(validate);
  });

  it('accepts a valid slug-file-content payload', () => {
    const result = validate(VALID_DOC);
    expect(result.ok).to.eql(true);
  });

  it('rejects non-object payloads', () => {
    const result = validate('nope');
    expect(result.ok).to.eql(false);
    if (result.ok) return;
    expect(result.error.message).to.contain('expected an object');
  });

  it('rejects schema mismatches', () => {
    const result = validate({ source: 'hello', contentType: 'text/markdown' });
    expect(result.ok).to.eql(false);
    if (result.ok) return;
    expect(result.error.message).to.contain('does not conform to schema');
  });

  it('index schema accepts entry list', () => {
    const index: t.SlugFileContentIndex = {
      entries: [
        { hash: 'a', contentType: 'text/markdown', frontmatter: { ref: 'crdt:a' } },
        { hash: 'b', contentType: 'text/markdown', frontmatter: { ref: 'crdt:b' } },
      ],
    };
    const ok = Schema.Value.Check(SlugFileContentSchema.Index, index);
    expect(ok).to.eql(true);
    expect(SlugFileContentSchema.Is.index(index)).to.eql(true);
  });
});
