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
      frontmatter: { ref: 'crdt:test' },
    };
    expect(Is.doc(doc)).to.eql(true);
    expect(
      Is.doc({ source: 'hello', contentType: 'text/markdown', frontmatter: { ref: 'crdt:test' } }),
    ).to.eql(false);
    expect(Is.doc({ source: 'hello', hash: '', contentType: 'text/markdown' })).to.eql(false);
    expect(Is.doc({ source: 'hello', hash: 'abc', contentType: 'text/markdown' })).to.eql(false);
  });

  it('doc accepts optional path', () => {
    const doc: t.SlugFileContentDoc = {
      source: 'hello',
      hash: 'abc',
      contentType: 'text/markdown',
      frontmatter: { ref: 'crdt:test', title: 'Hello' },
      path: 'docs/a.md',
    };
    expect(Is.doc(doc)).to.eql(true);
  });

  it('doc rejects frontmatter without ref', () => {
    expect(
      Is.doc({
        source: 'hello',
        hash: 'abc',
        contentType: 'text/markdown',
        frontmatter: {},
      }),
    ).to.eql(false);
    expect(
      Is.doc({
        source: 'hello',
        hash: 'abc',
        contentType: 'text/markdown',
        frontmatter: { title: 'Nope' },
      }),
    ).to.eql(false);
  });

  it('entry rejects missing source but accepts the entry shape', () => {
    const entry: t.SlugFileContentEntry = {
      hash: 'abc',
      contentType: 'text/markdown',
      frontmatter: { ref: 'crdt:test' },
    };
    expect(Is.entry(entry)).to.eql(true);
    expect(
      Is.entry({
        source: 'hello',
        hash: 'abc',
        contentType: 'text/markdown',
        frontmatter: { ref: 'crdt:test' },
      }),
    ).to.eql(true);
    expect(Is.doc(entry)).to.eql(false);
  });

  it('index accepts list of entries', () => {
    const index: t.SlugFileContentIndex = {
      docid: 'slug:test',
      entries: [
        { hash: 'a', contentType: 'text/markdown', frontmatter: { ref: 'crdt:a' } },
        { hash: 'b', contentType: 'text/markdown', frontmatter: { ref: 'crdt:b' } },
      ],
    };
    expect(Is.index(index)).to.eql(true);
  });
});
