import { type t, describe, expect, it } from '../../-test.ts';

import { Is } from '../m.Is.ts';
import { Path } from '../m.Path.ts';
import { Syncer } from '../m.Syncer.ts';
import { Yaml } from '../mod.ts';

type R = t.YamlParseResponse<unknown>;

describe('Yaml', () => {
  it('API', () => {
    expect(Yaml.Is).to.equal(Is);
    expect(Yaml.Syncer).to.equal(Syncer);
    expect(Yaml.syncer).to.equal(Syncer.make);
    expect(Yaml.Path).to.equal(Path);
    expect(Yaml.path).to.equal(Path.make);
  });

  describe('Yaml.parse', () => {
    it('parses valid YAML → returns data, no error', () => {
      const src = `
        name: Alice
        age: 30
      `;
      const res = Yaml.parse<{ name: string; age: number }>(src);
      expect(res.data).to.eql({ name: 'Alice', age: 30 });
      expect(res.error).to.eql(undefined);
    });

    it('invalid YAML → returns error, no data', () => {
      const src = `
        name Alice   
         -foo:
      `;
      const res = Yaml.parse(src);
      expect(res.data).to.eql(undefined);
      expect(res.error?.message).to.include('Failed to parse YAML');
      expect(res.error?.cause?.name).to.eql('YAMLParseError');
      expect(res.error?.cause?.message).to.include('Implicit keys need to be on a single line');
    });

    it('empty input → graceful no-data, no-error result', () => {
      const test = (input: string) => {
        const res = Yaml.parse(input);
        expect(res.data).to.eql(null);
        expect(res.error).to.eql(undefined);
      };
      test('');
      test('  ');
    });

    it('simple values', () => {
      const a = Yaml.parse('hello');
      const b = Yaml.parse('123');
      const c = Yaml.parse('true');
      const d = Yaml.parse('""');

      const assert = (res: R, expected: any) => {
        expect(res.data).to.eql(expected);
        expect(res.error).to.eql(undefined);
      };
      assert(a, 'hello');
      assert(b, 123);
      assert(c, true);
      assert(d, '');
    });

    it('array', () => {
      const src = `
        foo:
          - 1
          - two
          - { msg: three }
      `;
      const res = Yaml.parse<any>(src);
      expect(res.data.foo).to.eql([1, 'two', { msg: 'three' }]);
    });
  });

  describe('Yaml.parseAst', () => {
    it('parses valid YAML and returns the expected JS value', () => {
      const src = `
      name: 'Alice'
      age: 42
    `;
      const doc = Yaml.parseAst(src);
      expect(doc.errors).to.eql([]); // no parse errors
      expect(doc.toJS()).to.eql({ name: 'Alice', age: 42 }); // ← correct data.
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
  });
});
