import { type t, c, describe, expect, it } from '../-test.ts';
import { Immutable } from '../m.Immutable/mod.ts';
import { Yaml } from './mod.ts';

type O = Record<string, unknown>;
type R = t.YamlParseResponse<unknown>;

describe('Yaml', () => {
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
      expect(res.error?.message).to.eql('Failed to parse YAML.');
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

  describe('Yaml.syncer', () => {
    type T = { text?: string; foo?: { parsed: O } };

    it('print', () => {
      const doc = Immutable.clonerRef<T>({});
      const syncer = Yaml.syncer(doc, ['text']);
      console.info();
      console.info(c.bold(c.brightCyan('T:YamlSyncer:\b')));
      console.info(syncer);
      console.info();
    });

    describe('create', () => {
      it('create → doc variants', () => {
        const docA = Immutable.clonerRef<T>({});
        const docB = Immutable.clonerRef<T>({});
        const path = ['text'];

        const a = Yaml.syncer(docA, path);
        const b = Yaml.syncer({ source: docA }, path);
        const c = Yaml.syncer({ source: docA, target: docB }, path);

        expect(a.ok).to.eql(true);
        expect(b.ok).to.eql(true);
        expect(c.ok).to.eql(true);

        // Single document specified (source == target).
        expect(a.doc.source).to.equal(docA);
        expect(a.doc.target).to.equal(docA);
        expect(a.doc.target).to.equal(b.doc.source); // NB: used across source and target.

        // Partial specification (source == target).
        expect(b.doc.source).to.equal(docA);
        expect(b.doc.target).to.equal(docA);

        // Different source and target.
        expect(c.doc.source).to.equal(docA);
        expect(c.doc.target).to.equal(docB);
      });

      it.only('create → paths variants', () => {
        const docA = Immutable.clonerRef<T>({});
        const docB = Immutable.clonerRef<T>({});

        const a = Yaml.syncer(docA, ['text']);
        const b = Yaml.syncer(docA, { source: ['text'] });
        const c = Yaml.syncer({ source: docA, target: docB }, ['text']);
        const d = Yaml.syncer(docA, { source: ['text'], target: [] });
        const e = Yaml.syncer(docA, { source: ['text'], target: null });
        const f = Yaml.syncer(docA, { source: ['text'], target: ['foo', 'parsed'] });
        const g = Yaml.syncer(docA, { source: [], target: ['text'] });

        expect(a.ok).to.eql(true);
        expect(a.path.source).to.eql(['text']);
        expect(a.path.target).to.eql(['text.parsed']); // NB: modified so as not to overwrite the source on the same document.

        expect(b.ok).to.eql(true);
        expect(b.path.source).to.eql(['text']);
        expect(b.path.target).to.eql(['text.parsed']);

        expect(c.ok).to.eql(true);
        expect(c.path.source).to.eql(['text']);
        expect(c.path.target).to.eql(['text']); // NB: not modified, because targetting different document.

        expect(d.ok).to.eql(true); // NB: source with no target - event emitter only.
        expect(d.path.source).to.eql(['text']);
        expect(d.path.target).to.eql(null);

        // ↑ equivalent.
        expect(e.ok).to.eql(true);
        expect(e.path.source).to.eql(['text']);
        expect(e.path.target).to.eql(null);

        expect(f.ok).to.eql(true);
        expect(f.path.source).to.eql(['text']);
        expect(f.path.target).to.eql(['foo', 'parsed']);

        expect(g.ok).to.eql(false); // NB: source path empty - error condition.
        expect(g.path.source).to.eql(null);
        expect(g.path.target).to.eql(['text']);
      });
    });

    describe('error state', () => {
      it('error: no path slots (source or target)', () => {
        const doc = Immutable.clonerRef<T>({});

        const a = Yaml.syncer(doc, { source: [], target: ['text'] });
        const b = Yaml.syncer(doc, { source: [] });
        const c = Yaml.syncer(doc, { source: ['text'], target: [] });

        expect(a.ok).to.eql(false);
        expect(b.ok).to.eql(false);
        expect(c.ok).to.eql(false);

        expect(a.errors.length).to.eql(1);
        expect(b.errors.length).to.eql(1);
        expect(c.errors.length).to.eql(1);

        expect(a.errors[0].message).to.include('The source path is empty');
        expect(b.errors[0].message).to.include('The source path is empty');
        expect(c.errors[0].message).to.include('The target path is empty');
      });
    });

  });
});
