import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { Traits } from '../mod.ts';

describe('schema.file-list', () => {
  const S = Traits.Schema.FileList.Props;

  it('valid: minimal and typical shapes', () => {
    const cases = [
      {}, // minimal: all fields optional
      { name: 'Docs' },
      { description: 'Some notes' },
      { files: [] },
      { files: ['a.txt'] },
      { files: ['docs/readme.md', '/abs/path/to/file.mov'] },
      { name: 'Docs', files: ['x', 'y/z.ts'] },
      { name: '', files: [''] }, // empty strings allowed (no minLength constraint)
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

  it('valid: minimal and typical shapes', () => {
    const cases = [
      {}, // minimal: all fields optional
      { name: 'Docs' },
      { description: 'Some notes' },
      { files: [] },
      { files: ['a.txt'] },
      { files: ['docs/readme.md', '/abs/path/to/file.mov'] },
      { name: 'Docs', files: ['x', 'y/z.ts'] },
      { name: '', files: [''] }, // empty strings allowed (no minLength constraint)
      { description: '', files: ['a'] }, // empty description allowed
      { id: 'my-list', files: ['a'] }, // optional id allowed (pattern-owned)
      { id: 'list-01-alpha', name: 'Label', description: 'Text', files: ['x', 'y'] },
    ] as const;

    for (const v of cases) expect(Value.Check(S, v)).to.eql(true);
  });
});
