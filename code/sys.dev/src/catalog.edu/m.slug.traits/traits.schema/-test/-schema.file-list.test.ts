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
      [{ ref: 'a.txt' }], // object item without mime (now valid)
      [{ ref: 'a.txt', mime: 'text/plain' }], // object item with mime
      ['a.txt', { ref: 'b/c.md' }], // mixed with object lacking mime
      ['a.txt', { ref: 'b/c.md', mime: 'text/markdown' }], // mixed with mime
      [''], // empty string allowed
      [{ ref: '' }], // empty ref allowed by path pattern (no mime)
      [{ ref: '', mime: 'application/octet-stream' }], // empty ref with mime
      [{ ref: 'report.pdf', name: 'Q4 Report', mime: 'application/pdf' }], // with optional name
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
      ['file.v1.2.3.tar.gz'],
    ];
    for (const v of cases) expect(Value.Check(S, v)).to.eql(true, JSON.stringify(v));
  });

  it('valid: object item form (ref + optional mime) specifics', () => {
    const valids: unknown[] = [
      [{ ref: 'relative.txt' }],
      [{ ref: 'relative.txt', mime: 'text/plain' }],
      [{ ref: '' }],
      [{ ref: '', mime: 'application/octet-stream' }],
      ['a.txt', { ref: 'b/c.md' }],
      ['a.txt', { ref: 'b/c.md', mime: 'text/markdown' }],
      [{ ref: 'pic.png', name: 'Hero' }],
      [{ ref: 'pic.png', name: 'Hero', mime: 'image/png' }],
      [{ ref: 'data.bin', mime: 'APPLICATION/OCTET-STREAM' }], // uppercase tokens permitted by pattern
      [
        {
          ref: 'doc',
          mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      ],
      [{ ref: 'tile.mvt', mime: 'application/vnd.mapbox-vector-tile' }],
      [{ ref: 'md', mime: 'text/x-markdown' }],
      [{ ref: 'body', mime: 'application/ld+json' }],
    ];
    for (const v of valids) expect(Value.Check(S, v)).to.eql(true, JSON.stringify(v));
  });

  it('invalid: wrong shapes, missing fields, malformed mime, and noise (array root)', () => {
    const bads: unknown[] = [
      { files: ['ok'] }, // legacy object root
      'a.txt', // not an array
      [true], // invalid entry type
      [null], // invalid entry type
      [undefined as unknown as string], // invalid entry type
      [{}], // empty object element
      [{ mime: 'text/plain' }], // missing required ref
      [{ ref: 123, mime: 'text/plain' }], // wrong ref type
      [{ ref: 'a', mime: '' }], // empty mime (if present must match pattern)
      [{ ref: 'a', mime: 'image' }], // missing subtype
      [{ ref: 'a', mime: 'image/' }], // missing subtype token
      [{ ref: 'a', mime: '/png' }], // missing type token
      [{ ref: 'a', mime: 'image//png' }], // double slash
      [{ ref: 'a', mime: 'image/png; charset=utf-8' }], // parameters not allowed by pattern
      [{ ref: 'a', mime: 'image/pn*g' }], // illegal char
      [{ ref: 'a', mime: 'imáge/png' }], // non-ascii in token
      [{ ref: 'a', mime: 'application/json/xml' }], // extra slash
      [{ ref: 'a', mime: ' image/png' }], // leading space
      [{ ref: 'a', mime: 'image/png ' }], // trailing space
      [{ ref: 'a', mime: 'image/png', extra: true }], // additionalProperties: false
    ];
    for (const v of bads) expect(Value.Check(S, v)).to.eql(false, JSON.stringify(v));
  });
});
