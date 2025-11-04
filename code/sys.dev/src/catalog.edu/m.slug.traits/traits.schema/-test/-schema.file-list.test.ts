import { describe, expect, it } from '../../../-test.ts';
import { Value } from '../common.ts';
import {
  FileListItemSchema,
  FileListPropsInputSchema,
  FileListPropsSchema,
  normalizeFileList,
  Traits,
} from '../mod.ts';

describe('schema.file-list', () => {
  const S = Traits.Schema.FileList.Props;

  it('API', () => {
    expect(Traits.Schema.FileList.Input).to.equal(FileListPropsInputSchema);
    expect(Traits.Schema.FileList.Props).to.equal(FileListPropsSchema);
    expect(Traits.Schema.FileList.Item).to.equal(FileListItemSchema);
  });

  describe('Schema', () => {
    it('valid: minimal and typical shapes (array root)', () => {
      const cases: unknown[] = [
        [], // minimal: empty list
        ['a.txt'], // single string path
        ['a.txt', 'b/c.md'], // multiple string paths
        [{ ref: 'a.txt' }], // object item without mime
        [{ ref: 'a.txt', mime: 'text/plain' }], // object item with mime
        ['a.txt', { ref: 'b/c.md' }], // mixed with object lacking mime
        ['a.txt', { ref: 'b/c.md', mime: 'text/markdown' }], // mixed with mime
        [''], // empty string allowed by path pattern
        [{ ref: '' }], // empty ref allowed by path pattern
        [{ ref: '', mime: 'application/octet-stream' }], // empty ref with mime
        [{ ref: 'report.pdf', name: 'Q4 Report', mime: 'application/pdf' }], // optional name
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
        [{ ref: 'data.bin', mime: 'APPLICATION/OCTET-STREAM' }], // uppercase tokens permitted
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
        [{ ref: 'a', mime: '' }], // empty mime
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

  describe('schema.file-list (Input union)', () => {
    const S = Traits.Schema.FileList.Input;

    describe('valid roots', () => {
      it('single string → valid (authoring convenience)', () => {
        expect(Value.Check(S, 'a.txt')).to.eql(true);
        expect(Value.Check(S, './nested/file.webm')).to.eql(true);
        expect(Value.Check(S, '')).to.eql(true); // allowed by path pattern
      });

      it('single object {ref,...} → valid', () => {
        expect(Value.Check(S, { ref: 'a.txt' })).to.eql(true);
        expect(Value.Check(S, { ref: 'clip.webm', mime: 'video/webm' })).to.eql(true);
        expect(Value.Check(S, { ref: 'pic.png', name: 'Hero' })).to.eql(true);
        expect(Value.Check(S, { ref: 'pic.png', name: 'Hero', mime: 'image/png' })).to.eql(true);
      });

      it('array (canonical) still valid through Input union', () => {
        expect(Value.Check(S, ['a.txt', { ref: 'b/c.md', mime: 'text/markdown' }])).to.eql(true);
      });
    });

    describe('invalid roots', () => {
      const bads: unknown[] = [
        true, // not string/object/array
        42, // number root
        null, // null root
        undefined, // undefined root
        {}, // empty object (no ref)
        { mime: 'text/plain' }, // missing required ref
        { ref: 123 }, // ref wrong type
        { ref: 'a', mime: '' }, // empty mime
        { ref: 'a', mime: 'image' }, // missing subtype
        { ref: 'a', mime: 'image/' }, // missing subtype token
        { ref: 'a', mime: '/png' }, // missing type token
        { ref: 'a', mime: 'image//png' }, // double slash
        { ref: 'a', mime: 'image/png; charset=utf-8' }, // parameters not allowed
        { ref: 'a', mime: 'imáge/png' }, // non-ascii token
        { ref: 'a', mime: 'image/png', extra: true }, // additionalProperties: false
      ];

      for (const v of bads) {
        it(`invalid singleton: ${JSON.stringify(v)}`, () => {
          expect(Value.Check(S, v)).to.eql(false);
        });
      }
    });
  });

  describe('normalizeFileList (authoring → canonical)', () => {
    it('string → [{ref}]', () => {
      expect(normalizeFileList('x')).to.eql([{ ref: 'x' }]);
    });

    it('{ref} → [{ref}]', () => {
      expect(normalizeFileList({ ref: 'x', mime: 'text/plain' })).to.eql([
        { ref: 'x', mime: 'text/plain' },
      ]);
    });

    it('array passes through (mapped)', () => {
      expect(normalizeFileList(['a', { ref: 'b' }])).to.eql([{ ref: 'a' }, { ref: 'b' }]);
    });

    it('nullish → []', () => {
      expect(normalizeFileList()).to.eql([]);
      expect(normalizeFileList(null)).to.eql([]);
    });
  });

  describe('integration (authoring) — root slug uses file-list scalar', () => {
    it('validates scalar via Input schema and normalizes to array', () => {
      const doc = {
        slug: {
          id: 'test',
          traits: [{ as: 'video', of: 'file-list' }],
          data: { video: 'https://domain.com/video/file.webm' },
        },
      };

      // Authoring validator must point at the Input union:
      const inputSchema = Traits.Schema.FileList.Input;
      expect(Value.Check(inputSchema, doc.slug.data.video)).to.eql(true);

      // Normalize to canonical array-of-items for runtime:
      const list = normalizeFileList(doc.slug.data.video);
      expect(list).to.eql([{ ref: 'https://domain.com/video/file.webm' }]);

      // (Optional) If your runtime path validates against canonical Props:
      expect(Value.Check(Traits.Schema.FileList.Props, list)).to.eql(true);
    });
  });
});
