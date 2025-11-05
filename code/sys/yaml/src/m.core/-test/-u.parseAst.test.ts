import { type t, describe, expect, it } from '../../-test.ts';
import { Yaml } from '../mod.ts';

describe('Yaml.parseAst', () => {
  it('parses valid YAML and returns the expected JS value', () => {
    const src = `
      name: 'Alice'
      age: 42
    `;
    const doc = Yaml.parseAst(src);
    expect(doc.errors).to.eql([]); // no parse errors
    expect(Yaml.toJS(doc).value).to.eql({ name: 'Alice', age: 42 }); // ← correct data.
  });

  it('retains source-token ranges for nodes', () => {
    const doc = Yaml.parseAst('foo: bar');
    const root = doc.contents!; // YAMLMap node
    expect(Array.isArray((root as any).range)).to.eql(true);
    expect((root as any).range.length).to.eql(3); // ← [start, ?, end].
  });

  it('collects errors for malformed YAML instead of throwing', () => {
    const doc = Yaml.parseAst('foo: [1, 2'); // ← missing ].
    expect(doc.errors.length).to.be.greaterThan(0);
    expect(doc.errors[0].name).to.eql('YAMLParseError');
    expect(doc.errors.length).to.eql(1);
  });

  describe('YAML anchors/aliases', () => {
    it('throws on unresolved (unnamed) alias during toJS()', () => {
      const src = `
        tmpl: &video
          - as: video
            of: file-list
        slugs:
          - slug: *
      `;
      const doc = Yaml.parseAst(src);

      // Resolution/JS conversion is where the error is raised:
      const res = Yaml.toJS(doc);
      expect(res.ok).to.eql(false);
    });
  });
});

describe('Yaml.toJS', () => {});
