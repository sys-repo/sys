import { c, describe, expect, it, type t, Time } from '../-test.ts';
import { Err, ERR, Immutable, rx } from './common.ts';
import { Is } from './m.Is.ts';
import { Yaml } from './mod.ts';

type O = Record<string, unknown>;
type R = t.YamlParseResponse<unknown>;

describe('Yaml', () => {
  it('API', () => {
    expect(Yaml.Is).to.equal(Is);
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

  describe('Yaml.syncer', () => {
    it('print', () => {
      type T = { text?: string };
      const doc = Immutable.clonerRef<T>({});
      const syncer = Yaml.syncer(doc, ['text']);
      console.info();
      console.info(c.bold(c.brightCyan('T:YamlSyncer:\b')));
      console.info(syncer);
      console.info();
    });

    describe('create', () => {
      it('create → doc variants', () => {
        type T = { text?: string };
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

      it('create → paths variants', () => {
        type T = { text?: string; foo?: { parsed: O } };
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

        expect(d.ok).to.eql(true); // NB: source with no target: event emitter only.
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
      type T = { text?: string };
      it('error: no path slots (source or target)', () => {
        const doc = Immutable.clonerRef<T>({});

        const a = Yaml.syncer(doc, { source: [], target: ['text'] });
        const b = Yaml.syncer(doc, { source: [] });
        const c = Yaml.syncer(doc, { source: ['text'], target: [] });

        expect(a.ok).to.eql(false);
        expect(b.ok).to.eql(false);
        expect(c.ok).to.eql(true); // Exception - empty target path converted to null (event-emitter only mode).
        expect(c.path.target).to.eql(null);

        expect(a.errors.length).to.eql(1);
        expect(b.errors.length).to.eql(1);
        expect(c.errors.length).to.eql(0);
        expect(a.errors[0].message).to.include('The source path is empty');
        expect(b.errors[0].message).to.include('The source path is empty');
      });
    });

    describe('sync/parsing', () => {
      type T = { text?: string; 'text.parsed'?: O };
      type E = t.YamlSyncParserChange<T>;
      const sample = (text?: string) => {
        const doc = Immutable.clonerRef<T>({ text });
        const syncer = Yaml.syncer<T>(doc, ['text']);
        return { doc, syncer } as const;
      };

      it('initial parse', () => {
        const test = (text?: string, expected?: any) => {
          const { doc, syncer } = sample(text);
          expect(syncer.ok).to.eql(true);
          expect(syncer.errors).to.eql([]);
          expect(doc.current['text.parsed']).to.eql(expected);
          expect(syncer.current.yaml()).to.eql(text);
          expect(syncer.current.parsed()).to.eql(expected);
        };
        test('', null);
        test('  ', null);
        test('foo: 123', { foo: 123 });
        test('123', 123);
        test('""', '');
      });

      it('initial parse: error', () => {
        const { doc, syncer } = sample('foo: 123\n -b: a FAIL');
        expect(syncer.ok).to.eql(false);
        expect(syncer.errors.length).to.eql(1);
        expect(Yaml.Is.parseError(syncer.errors[0])).to.eql(true);
        expect(doc.current['text.parsed']).to.eql(undefined);
      });

      it('parse on change: sync (with events)', () => {
        const { doc, syncer } = sample();

        const fired: E[] = [];
        syncer.$.subscribe((e) => fired.push(e));

        expect(doc.current['text.parsed']).to.eql(null); // NB: default empty YAML parse result.
        expect(syncer.ok).to.eql(true);

        // Parsable YAML:
        doc.change((d) => (d.text = 'foo: 123'));
        expect(doc.current['text.parsed']).to.eql({ foo: 123 });
        expect(syncer.ok).to.eql(true);

        expect(fired.length).to.eql(1);
        expect(fired[0].yaml).to.eql({ before: '', after: 'foo: 123' });
        expect(fired[0].parsed).to.eql({ foo: 123 });
        expect(fired[0].error).to.eql(undefined);
        expect(fired[0].ops.length).to.eql(1);
        expect(fired[0].ops[0].type).to.eql('update');

        // Error:
        const fail = 'foo: 123\n -foo: FAIL';
        doc.change((d) => (d.text = fail));
        expect(doc.current['text.parsed']).to.eql({ foo: 123 }); // NB: prior value (not updated after error).
        expect(syncer.ok).to.eql(false);
        expect(syncer.errors.length).to.eql(1);

        expect(fired.length).to.eql(2);
        expect(fired[1].parsed).to.eql(undefined);
        expect(Yaml.Is.parseError(fired[1].error)).to.eql(true);

        // Come back from error:
        doc.change((d) => (d.text = 'foo: 456'));
        expect(doc.current['text.parsed']).to.eql({ foo: 456 });
        expect(syncer.ok).to.eql(true);
        expect(syncer.errors).to.eql([]);

        expect(fired.length).to.eql(3);
        expect(fired[2].parsed).to.eql({ foo: 456 });
        expect(fired[2].error).to.eql(undefined);
        expect(fired[2].yaml).to.eql({ before: fail, after: 'foo: 456' });

        expect(fired[2].ops.length).to.eql(1);
        expect(fired[2].ops[0].type).to.eql('update');
        if (fired[2].ops[0].type === 'update') {
          expect(fired[2].ops[0].prev).to.eql(123);
          expect(fired[2].ops[0].next).to.eql(456);
        }
      });

      it('parse on change: async (debounced)', async () => {
        const doc = Immutable.clonerRef<T>({});
        Yaml.syncer<T>(doc, ['text'], { debounce: 20 });

        doc.change((d) => (d.text = 'foo: 1'));
        doc.change((d) => (d.text = 'foo: 2'));
        await Time.wait(5);
        doc.change((d) => (d.text = 'foo: 3'));
        expect(doc.current['text.parsed']).to.eql(null); // NB: debouce not timed-out yet.

        await Time.wait(30);
        expect(doc.current['text.parsed']).to.eql({ foo: 3 });
      });

      it('object diff', () => {
        const doc = Immutable.clonerRef<T>({});
        Yaml.syncer<T>(doc, ['text']);

        doc.change((d) => (d.text = 'foo: { bar: { value: 0 } }'));
        expect(doc.current['text.parsed']).to.eql({ foo: { bar: { value: 0 } } });

        doc.change((d) => (d.text = 'foo: { bar: { value: 1234 } }'));
        expect(doc.current['text.parsed']).to.eql({ foo: { bar: { value: 1234 } } });
      });

      it('write to different document', () => {
        const source = Immutable.clonerRef<{ text?: string }>({});
        const target = Immutable.clonerRef<{ text?: t.YamPrimitives }>({});
        const syncer = Yaml.syncer<T>({ source, target }, ['text']);

        source.change((d) => (d.text = 'foo: 123'));
        expect(source.current).to.eql({ text: 'foo: 123' });
        expect(target.current).to.eql({ text: { foo: 123 } });

        syncer.dispose();
      });

      describe('dispose', () => {
        it('via: method', () => {
          const { doc, syncer } = sample();
          expect(syncer.disposed).to.eql(false);

          const fired: E[] = [];
          syncer.$.subscribe((e) => fired.push(e));

          doc.change((d) => (d.text = 'foo: 123'));
          expect(fired.length).to.eql(1);
          expect(doc.current['text.parsed']).to.eql({ foo: 123 });

          syncer.dispose();
          expect(syncer.disposed).to.eql(true);

          doc.change((d) => (d.text = 'foo: 456'));
          doc.change((d) => (d.text = 'foo: 789'));

          expect(fired.length).to.eql(1); // NB: no more events fired.
          expect(doc.current['text.parsed']).to.eql({ foo: 123 }); // NB: no more updates to target.
        });

        it('via: dispose$ observable', () => {
          const { dispose, dispose$ } = rx.lifecycle();
          const doc = Immutable.clonerRef<T>({});
          const syncer = Yaml.syncer<T>(doc, ['text'], { dispose$ });

          expect(syncer.disposed).to.eql(false);
          dispose();
          expect(syncer.disposed).to.eql(true);
        });
      });
    });
  });

  describe('Yaml.Is', () => {
    it('Is.parseError', () => {
      const test = (input: any, expected: boolean) => {
        const res = Yaml.Is.parseError(input);
        expect(res).to.eql(expected);
      };

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => test(value, false));
      test(Err.std('foo'), false);

      test(Err.std('foo', { name: ERR.PARSE }), true);
      test(Err.std('foo', { cause: { name: ERR.PARSE, message: 'derp' } }), true);
    });
  });
});
