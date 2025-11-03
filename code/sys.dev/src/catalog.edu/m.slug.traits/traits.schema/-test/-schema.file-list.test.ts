import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import { Traits } from '../mod.ts';

describe('schema.file-list', () => {
  const S = Traits.Schema.FileList.Props;

  it('valid: minimal and typical shapes (array root)', () => {
    const cases: unknown[] = [
      [], // minimal: empty list
      ['a.txt'], // single string path
      ['a.txt', 'b/c.md'], // multiple string paths
      [{ ref: 'a.txt' }], // single object item
      ['a.txt', { ref: 'b/c.md' }], // mixed
      [''], // empty string allowed
      [{ ref: '' }], // empty ref allowed
    ];
    for (const v of cases) expect(Value.Check(S, v)).to.eql(true, JSON.stringify(v));
  });

  it('valid: path strings are freeform (no enforced pattern)', () => {
    const cases: unknown[] = [
      ['relative.txt'],
      ['nested/dir/file.md'],
      ['./dot/leading'],
      ['../up/one'],
      ['space name.txt'],
      ['under_score.ext'],
      ['dash-name.ext'],
    ];
    for (const v of cases) expect(Value.Check(S, v)).to.eql(true, JSON.stringify(v));
  });

  it('valid: object item form specifics', () => {
    const valids: unknown[] = [
      [{ ref: 'relative.txt' }],
      [{ ref: '' }],
      ['a.txt', { ref: 'b/c.md' }],
    ];

    const invalids: unknown[] = [
      {}, // not an array
      { files: ['a'] }, // legacy object form
      [123],
      [null],
      [{}],
      [{ ref: 123 }],
      [true],
      [{ ref: 'ok', extra: true }], // additionalProperties: false on item object
    ];

    for (const v of valids) expect(Value.Check(S, v)).to.eql(true, JSON.stringify(v));
    for (const v of invalids) expect(Value.Check(S, v)).to.eql(false, JSON.stringify(v));
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
