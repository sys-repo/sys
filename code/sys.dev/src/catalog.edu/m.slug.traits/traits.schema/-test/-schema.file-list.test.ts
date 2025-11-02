import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { Traits } from '../mod.ts';

describe('schema.file-list', () => {
  const S = Traits.Schema.FileList.Props;

  it('valid: minimal and typical shapes (files optional)', () => {
    const cases = [
      {}, // minimal: all fields optional
      { name: 'Docs' },
      { description: 'Some notes' },

      // string entries
      { files: [] },
      { files: ['a.txt'] },
      { files: ['docs/readme.md', '/abs/path/to/file.mov'] },
      { name: 'Docs', files: ['x', 'y/z.ts'] },
      { name: '', files: [''] }, // empty strings allowed (no minLength constraint)
      { description: '', files: ['a'] }, // empty description allowed
      { id: 'my-list', files: ['a'] }, // optional id allowed (pattern-owned)
      { id: 'list-01-alpha', name: 'Label', description: 'Text', files: ['x', 'y'] },

      // object item entries
      { files: [{ ref: 'a.txt' }] },
      { files: [{ ref: 'crdt:create' }] },
      { files: [{ ref: '' }] }, // empty ref is allowed (no minLength constraint)

      // mixed string + object forms
      { files: ['a.txt', { ref: 'b/c.md' }, 'd.mov'] },
    ] as const;

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true, JSON.stringify(v));
  });

  it('valid: path strings are freeform (no enforced pattern)', () => {
    const cases = [
      { files: ['relative.txt'] },
      { files: ['/abs/path/to/file.mov'] },
      { files: ['..//weird//segments//ok'] },
      { files: ['C:\\path\\on\\windows.ext'] },
      { files: ['スペース/日本語/ファイル.md'] },
      { files: ['.hidden', './dot/relative'] },
      { files: [''] }, // empty string allowed by design
    ] as const;

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true, JSON.stringify(v));
  });

  it('valid: object item form specifics', () => {
    const cases = [
      { files: [{ ref: 'relative.txt' }] },
      { files: [{ ref: '/abs/path/to/file.mov' }] },
      { files: [{ ref: 'C:\\path\\windows.ext' }] },
      { files: [{ ref: 'スペース/日本語/ファイル.md' }] },
      { files: [{ ref: '' }] }, // empty ref allowed
      { files: [{ ref: '.hidden' }, { ref: './dot/relative' }] },
    ] as const;

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true, JSON.stringify(v));
  });

  it('invalid: wrong shapes and noise', () => {
    const bads: unknown[] = [
      // files type
      { files: 'not-an-array' },
      { files: [123] },
      { files: [null] },
      { files: [{}] }, // object without ref
      { files: [{ ref: 123 }] }, // wrong ref type
      { files: [{ ref: 'a', extra: true }] }, // additionalProperties: false on item
      { files: ['ok', { nope: 'x' }] }, // invalid object element
      { files: [{ ref: 'ok' }, null] },

      // top-level field types
      { name: 123 },
      { name: { label: 'nope' } },
      { description: 123 },
      { description: { text: 'nope' } },
      { description: null },
      { description: true },
      { id: 42 },
      { id: { key: 'nope' } },

      // disallowed extra top-level properties
      { files: ['ok'], extra: true },
    ];

    for (const v of bads) expect(Value.Check(S, v)).to.eql(false, JSON.stringify(v));
  });
});
