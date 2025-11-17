import { type t, afterEach, describe, expect, expectError, expectTypeOf, it } from '../../-test.ts';
import { CrdtIs } from '../common.ts';
import { CrdtWorker } from '../mod.ts';
import { createTestHelpers } from './u.ts';

type O = Record<string, unknown>;
type Doc = { foo: string | number };

describe('CrdtWorker.doc (shim)', { sanitizeResources: false, sanitizeOps: false }, () => {
  const Test = createTestHelpers();
  afterEach(Test.reset);

  describe('API', () => {
    it('structural typing', () => {
      type Base = t.CrdtRef<Doc>;
      type Proxy = t.CrdtDocWorkerProxy<Doc>;
      const value = {} as Proxy;

      // Must behave as a normal CrdtRef<Doc>.
      expectTypeOf(value).toMatchTypeOf<Base>();

      // Runtime witness for the branding field.
      // And the branding flag must be exactly the literal 'worker-proxy'.
      const via: Proxy['via'] = 'worker-proxy';
      expectTypeOf(via).toEqualTypeOf<'worker-proxy'>();
    });
  });

  describe('Crdt.Worker.doc()', () => {
    it('reads a doc from a worker-backed proxy repo', async () => {
      // Real repo/doc on the simulated worker-host.
      const realRepo = Test.realRepo();
      const realDoc = realRepo.create<Doc>({ foo: 123 });
      expect((await realRepo.get(realDoc.id)).doc?.id).to.eql(realDoc.id); // sanity

      // Wire up ports.
      const { port1, port2 } = Test.makePorts();
      CrdtWorker.attach(port2, realRepo);

      // Client proxy repo.
      const proxyRepo = await CrdtWorker.repo(port1).whenReady();

      // 5. Fetch the doc through the worker doc shim.
      const res = await CrdtWorker.doc<Doc>(proxyRepo, realDoc.id);
      expect(res.ok).to.be.true;
      if (res.ok) {
        expect(res.data.id).to.eql(realDoc.id);
        expect(res.data.via === 'worker-proxy').to.be.true;
        expectTypeOf(res.data).toMatchTypeOf<t.CrdtDocWorkerProxy<Doc>>(); // Branded worker discriminant.
      }

      // Cleanup:
      realDoc.dispose();
      await proxyRepo.dispose();
      await realRepo.dispose();
    });

    describe('errors (failure conditions)', () => {
      it('hard throws if passed `repo` is not a worker-proxy', async () => {
        const realRepo = Test.realRepo();
        expect(CrdtIs.proxy(realRepo)).to.eql(false); // sanity
        await expectError(
          () => CrdtWorker.doc<Doc>(realRepo, '4Hitb4MhfusQm28o8Ca7vdoLvBqC'),
          'invalid repo, worker-proxy expected',
        );
      });

      it('returns TryFail when repo.get returns a CrdtRepoError', async () => {
        const realRepo = Test.realRepo();
        const err: t.CrdtRepoError = {
          name: 'CrdtRepoError',
          kind: 'Timeout',
          message: 'took too long',
        };

        // Stub worker-side get to always return an error.
        const restoreGet = Test.stubRepoGet<Doc>(realRepo, async (id, options) => {
          const result: t.CrdtRefGetResponse<Doc> = { error: err };
          return result;
        });

        const { port1, port2 } = Test.makePorts();
        CrdtWorker.attach(port2, realRepo);
        const proxyRepo = await CrdtWorker.repo(port1).whenReady();

        const res = await CrdtWorker.doc<Doc>(proxyRepo, 'fake-id');

        expect(res.ok).to.eql(false);
        if (!res.ok) {
          // Identity: the same error object survived the round trip.
          const caught = res.error as t.CrdtRepoError;
          expect(caught.kind).to.eql<'Timeout'>('Timeout');
          expect(caught.name).to.eql('CrdtRepoError');
          expect(caught.message).to.eql('took too long');
        }

        // Cleanup:
        restoreGet();
        await proxyRepo.dispose();
        await realRepo.dispose();
      });

      it('returns TryFail when repo.get returns neither doc nor error', async () => {
        const realRepo = Test.realRepo();
        const restoreGet = Test.stubRepoGet<Doc>(realRepo, async (id, options) => {
          const result: t.CrdtRefGetResponse<Doc> = { doc: undefined, error: undefined };
          return result;
        });

        const { port1, port2 } = Test.makePorts();
        CrdtWorker.attach(port2, realRepo);

        const proxyRepo = CrdtWorker.repo(port1);
        const id = 'doc-missing' as t.StringId;
        const res = await CrdtWorker.doc<Doc>(proxyRepo, id);

        expect(res.ok).to.eql(false);
        if (!res.ok) {
          const msg = res.error.message;
          expect(msg).to.contain(`CrdtWorker.doc: repo.get("${id}") returned no doc`);
        }

        // Cleanup:
        restoreGet();
        await proxyRepo.dispose();
        await realRepo.dispose();
      });
    });
  });

  describe('doc proxy surface', () => {
    it('behaves like a CrdtRef<T> on the main thread', async () => {
      // Real repo/doc on the simulated worker-host.
      const realRepo = Test.realRepo();
      const realDoc = realRepo.create<Doc>({ foo: 123 });
      expect((await realRepo.get(realDoc.id)).doc?.current).to.eql({ foo: 123 }); // sanity

      // Wire up ports.
      const { port1, port2 } = Test.makePorts();
      CrdtWorker.attach(port2, realRepo);

      // Client proxy repo.
      const proxyRepo = await CrdtWorker.repo(port1).whenReady();

      // Fetch the doc through the worker doc helper.
      const res = await CrdtWorker.doc<Doc>(proxyRepo, realDoc.id);

      expect(res.ok).to.eql(true);
      if (!res.ok) throw res.error; // keep type-narrowed below

      // Cleanup.
      // ev.dispose?.();
      realDoc.dispose();
      await proxyRepo.dispose();
      await realRepo.dispose();
    });
  });
});
