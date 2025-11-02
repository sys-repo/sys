import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { Traits } from '../mod.ts';

describe('schema.file-list', () => {
  const S = Traits.Schema.FileList.Props;

  it('valid: minimal and typical shapes', () => {
    const cases = [
      { files: [] }, // minimal: required field present
      { files: ['a.txt'] },
      { files: ['docs/readme.md', '/abs/path/to/file.mov'] },
      { name: 'Docs', files: ['x', 'y/z.ts'] },
      { name: '', files: [''] }, // empty strings allowed (no minLength constraint)
      { description: 'Some notes', files: ['a/b/c.txt'] },
      { description: '', files: ['a'] }, // empty description allowed
      { id: 'my-list', files: ['a'] }, // optional id allowed (pattern-owned)
      { id: 'list-01-alpha', name: 'Label', description: 'Text', files: ['x', 'y'] },
    ] as const;

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true);
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

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true);
  });

  it('invalid: missing files, wrong shapes, noise', () => {
    const bads: unknown[] = [
      {}, // files missing (required)
      { name: 'Only name' },
      { description: 'Only description' },
      { files: 'not-an-array' },
      { files: [123] },
      { files: [null] },
      { files: [{}] },
      { name: 123, files: [] },
      { name: { label: 'nope' }, files: ['a'] },
      { description: 123, files: ['a'] },
      { description: { text: 'nope' }, files: ['a'] },
      { description: null, files: ['a'] },
      { description: true, files: ['a'] },
      { id: 42, files: ['a'] },
      { id: { key: 'nope' }, files: ['a'] },
      { files: ['ok'], extra: true }, // additionalProperties: false
    ];

    for (const v of bads) expect(Value.Check(S, v)).to.eql(false);
  });
});
