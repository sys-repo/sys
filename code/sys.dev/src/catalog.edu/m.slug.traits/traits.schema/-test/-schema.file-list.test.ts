import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { Traits } from '../mod.ts';

describe('schema.file-list', () => {
  const S = Traits.Schema.FileList.Props;

  it('valid: files (required) with optional name', () => {
    const cases = [
      { files: [] }, // empty allowed by schema
      { files: ['a.txt'] },
      { files: ['docs/readme.md', '/abs/path/to/file.mov'] },
      { name: 'Docs', files: ['x', 'y/z.ts'] },
      { name: '', files: [''] }, // empty strings allowed (no minLength constraint)
    ] as const;

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true);
  });

  it('invalid: missing files, wrong shapes, noise', () => {
    const bads: unknown[] = [
      {}, // files missing
      { name: 'Only name' },
      { files: 'not-an-array' },
      { files: [123] },
      { files: [null] },
      { name: 123, files: [] },
      { name: { label: 'nope' }, files: ['a'] },
      { files: ['ok'], extra: true }, // additionalProperties: false
    ];

    for (const v of bads) expect(Value.Check(S, v)).to.eql(false);
  });
});
