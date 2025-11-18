import {
  type t,
  Str,
  c,
  afterEach,
  describe,
  expect,
  expectError,
  expectTypeOf,
  it,
} from '../../-test.ts';
import { CrdtIs, Schedule } from '../common.ts';
import { CrdtWorker } from '../mod.ts';
import { createTestHelpers, Wait } from './u.ts';

type O = Record<string, unknown>;
type Doc = { foo: string | number };

describe('CrdtWorker.doc (shim)', { sanitizeResources: false, sanitizeOps: false }, () => {
  const Test = createTestHelpers();
  afterEach(Test.reset);

  async function sampleSetup() {
    const { port1, port2 } = Test.makePorts();
    const realRepo = await Test.realRepo().whenReady();

    CrdtWorker.attach(port2, realRepo);
    const proxyRepo = await CrdtWorker.repo(port1).whenReady();
    const realDoc = realRepo.create<Doc>({ foo: 123 });

    async function dispose() {
      realDoc.dispose();
      await proxyRepo.dispose();
      await realRepo.dispose();
    }

    return {
      port1,
      port2,
      real: { repo: realRepo, doc: realDoc },
      proxy: { repo: proxyRepo },
      dispose,
    } as const;
  }

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

      const ev = realDoc.events();
      const m = ev.deleted$;
      // realDoc.instance

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

  describe('createDocProxy: proxy surface', () => {
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

      // Identity + brand.
      const doc = res.data;
      expect(doc.id).to.eql(realDoc.id);
      expect(doc.instance.length > 4).to.be.true;
      expect(doc.via).to.eql<'worker-proxy'>('worker-proxy');

      // Cleanup.
      // ev.dispose?.();
      realDoc.dispose();
      await proxyRepo.dispose();
      await realRepo.dispose();
    });

    describe('lifecycle', () => {
      it('disposes when parent/host repo disposes', async () => {
        const test = async (disposeOf: 'real-repo' | 'proxy-repo') => {
          const sample = await sampleSetup();
          const { real, proxy } = sample;

          const res = await CrdtWorker.doc<Doc>(proxy.repo, real.doc.id);
          expect(res.ok).to.eql(true);
          if (!res.ok) throw res.error;

          const doc = res.data;
          expect(doc.disposed).to.eql(false);

          let completed = false;
          doc.dispose$.subscribe({ complete: () => (completed = true) });

          if (disposeOf === 'real-repo') await real.repo.dispose();
          if (disposeOf === 'proxy-repo') proxy.repo.dispose();

          await Wait.waitFor(() => doc.disposed);

          expect(doc.disposed).to.eql(true);
          expect(completed).to.eql(true);
          if (disposeOf === 'real-repo') expect(real.repo.disposed).to.eql(true);
          if (disposeOf === 'proxy-repo') expect(proxy.repo.disposed).to.eql(true);

          await sample.dispose();
        };

        await test('real-repo');
        await test('proxy-repo');
      });
    });

    describe('doc stream (host attach → proxy ref)', () => {
      it('mirrors host doc changes over the worker wire', async () => {
        const sample = await sampleSetup();
        const { real, proxy } = sample;

        const res = await CrdtWorker.doc<Doc>(proxy.repo, real.doc.id);
        if (!res.ok) throw res.error;

        const doc = res.data;

        // Print:
        console.info();
        console.info(c.cyan(`Crdt.Worker.doc: (Proxy)`));
        console.info(doc);
        console.info();

        // Cleanup:
        await sample.dispose();
      });
    });
  });
});
