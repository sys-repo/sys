import { type t, Try, describe, expectTypeOf, it, expect } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';

type O = Record<string, unknown>;

describe('CrdtWorker.doc (shim)', () => {
  it('CrdtDocWorkerShim: structural typing', () => {
    type Doc = { foo: string };
    type Base = t.CrdtRef<Doc>;
    type Shim = t.CrdtDocWorkerShim<Doc>;

    // Runtime witness for the whole shim type.
    const value = {} as Shim;

    // Must behave as a normal CrdtRef<Doc>.
    expectTypeOf(value).toMatchTypeOf<Base>();

    // Runtime witness for the branding field.
    const via: Shim['via'] = 'worker-proxy';

    // And the branding flag must be exactly the literal 'worker-proxy'.
    expectTypeOf(via).toEqualTypeOf<'worker-proxy'>();
  });

  describe('doc()', () => {
    type Doc = { foo: string };

    it('resolves with the worker-branded ref on success', async () => {
      // Minimal worker-branded ref (we only care about brand + identity).
      const id = 'doc-1' as t.StringId;
      const ref = { id, via: 'worker-proxy' } as t.CrdtDocWorkerShim<Doc>;

      // Fake worker repo shim: only get() is exercised by doc().
      const repo = {
        async get<T extends O>() {
          const result: t.CrdtRefGetResponse<T> = { doc: ref as unknown as t.CrdtRef<T> };
          return result;
        },
      } as unknown as t.CrdtRepoWorkerShim;

      const result = await CrdtWorker.doc<Doc>(repo, id);

      // Identity: we get back the exact ref the worker returned.
      expect(result).to.equal(ref);

      // Brand: via is the literal worker-proxy.
      expect(result.via).to.eql<'worker-proxy'>('worker-proxy');

      // Types: result is a CrdtDocWorkerShim<Doc>.
      expectTypeOf(result).toMatchTypeOf<t.CrdtDocWorkerShim<Doc>>();
    });

    it('rejects with domain errors returned from repo.get', async () => {
      const id = 'doc-err' as t.StringId;
      const error: t.CrdtRepoError = {
        name: 'CrdtRepoError',
        kind: 'Timeout',
        message: 'took too long',
      };
      const repo = {
        async get<T extends O>() {
          const result: t.CrdtRefGetResponse<T> = { error };
          return result;
        },
      } as unknown as t.CrdtRepoWorkerShim;

      const { result } = await Try.run(() => CrdtWorker.doc<Doc>(repo, id));
      const caught = result.error as t.CrdtRepoError | undefined;

      expect(caught).to.exist;
      if (caught) {
        expect(caught).to.equal(error); // same instance
        expect(caught.kind).to.eql<'Timeout'>('Timeout');
        expect(caught.message).to.eql('took too long');
      }
    });

    it('rejects when repo.get returns neither error nor doc', async () => {
      const id = 'doc-missing' as t.StringId;
      const repo = {
        async get<T extends O>() {
          const result: t.CrdtRefGetResponse<T> = {};
          return result;
        },
      } as unknown as t.CrdtRepoWorkerShim;

      const { result } = await Try.run(() => CrdtWorker.doc<Doc>(repo, id));
      const caught = result.error as Error | undefined;

      expect(caught).to.exist;
      expect(caught?.message).to.contain('CrdtWorker.doc: repo.get("doc-missing") returned no doc');
    });
  });
});
