import { describe, expect, it, type t } from '../../../-test.ts';
import { Is } from '../m.Is.ts';
import { SlugFileContentSchema } from '../mod.ts';

describe('SlugFileContent.Is', () => {
  it('API', () => {
    expect(SlugFileContentSchema.Is).to.equal(Is);
  });

  it('doc accepts valid content and rejects missing fields', () => {
    const doc: t.SlugFileContentDoc = {
      source: 'hello',
      hash: 'abc',
      contentType: 'text/markdown',
    };
    expect(Is.doc(doc)).to.eql(true);
    expect(Is.doc({ source: 'hello', contentType: 'text/markdown' })).to.eql(false);
    expect(Is.doc({ source: 'hello', hash: '', contentType: 'text/markdown' })).to.eql(false);
  });

  it('doc accepts optional path', () => {
    const doc: t.SlugFileContentDoc = {
      source: 'hello',
      hash: 'abc',
      contentType: 'text/markdown',
      path: 'docs/a.md',
    };
    expect(Is.doc(doc)).to.eql(true);
  });
});
