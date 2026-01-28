import { afterEach, describe, expect, it, Schedule } from '../../-test.ts';
import { CrdtWorkerCmd } from '../mod.ts';
import { getRepoPort } from '../u.client.repo.ts';
import { createTestHelpers } from './u.ts';

type D = { count: number; name?: string };

describe(
  'CrdtWorkerCmd.Client.repo (proxy)',
  { sanitizeResources: false, sanitizeOps: false },
  () => {
    const Test = createTestHelpers();
    afterEach(Test.reset);

    it('creates a repo proxy over MessagePort', async () => {
      const { port1, port2 } = Test.makePorts();
      const realRepo = await Test.realRepo().whenReady();

      CrdtWorkerCmd.Host.attach(port2, realRepo);
      const proxyRepo = CrdtWorkerCmd.Client.repo(port1);

      expect((proxyRepo as any).via).to.eql('worker-proxy');
      expect(proxyRepo.status.ready).to.eql(false);

      await proxyRepo.whenReady();
      expect(proxyRepo.status.ready).to.eql(true);
      expect(proxyRepo.id.instance).to.eql(realRepo.id.instance);

      await proxyRepo.dispose();
      await realRepo.dispose();
    });

    it('getRepoPort retrieves the underlying MessagePort', async () => {
      const { port1, port2 } = Test.makePorts();
      const realRepo = await Test.realRepo().whenReady();

      CrdtWorkerCmd.Host.attach(port2, realRepo);
      const proxyRepo = CrdtWorkerCmd.Client.repo(port1);

      const port = getRepoPort(proxyRepo as any);
      expect(port).to.equal(port1);

      await proxyRepo.dispose();
      await realRepo.dispose();
    });

    it('repo.create → returns doc proxy', async () => {
      const sample = await Test.sample<D>({ count: 0 });
      const { proxy, real } = sample;

      const result = await proxy.repo.create<D>({ count: 42 });
      expect(result.ok).to.eql(true);
      expect(result.doc?.id).to.be.a('string');
      expect((result.doc as any)?.via).to.eql('worker-proxy');

      // Wait for snapshot to arrive
      await Schedule.waitFor(() => result.doc?.current.count === 42);
      expect(result.doc?.current.count).to.eql(42);

      await sample.dispose();
    });

    it('repo.get → returns doc proxy for existing doc', async () => {
      const sample = await Test.sample<D>({ count: 0 });
      const { proxy, real } = sample;

      const result = await proxy.repo.get<D>(real.doc.id);
      expect(result.ok).to.eql(true);
      expect(result.doc?.id).to.eql(real.doc.id);
      expect((result.doc as any)?.via).to.eql('worker-proxy');

      // Wait for snapshot to arrive
      await Schedule.waitFor(() => result.doc?.current.count === 0);
      expect(result.doc?.current.count).to.eql(0);

      await sample.dispose();
    });

    it('repo.get → returns error for non-existent doc', async () => {
      const sample = await Test.sample<D>({ count: 0 });
      const { proxy } = sample;

      const result = await proxy.repo.get<D>('non-existent-id');
      expect(result.ok).to.eql(false);
      expect(result.error).to.exist;

      await sample.dispose();
    });

    it('repo.delete → removes document', async () => {
      const sample = await Test.sample<D>({ count: 0 });
      const { proxy, real } = sample;

      // First get the doc to ensure it exists
      const getResult = await proxy.repo.get<D>(real.doc.id);
      expect(getResult.ok).to.eql(true);

      // Delete it
      await proxy.repo.delete(real.doc.id);

      // Verify it's gone (should return error)
      const afterDelete = await proxy.repo.get<D>(real.doc.id);
      expect(afterDelete.ok).to.eql(false);

      await sample.dispose();
    });

    it('doc proxy receives changes from real doc', async () => {
      const sample = await Test.sample<D>({ count: 0 });
      const { proxy, real } = sample;

      const result = await proxy.repo.get<D>(real.doc.id);
      expect(result.ok).to.eql(true);
      const proxyDoc = result.doc!;

      // Wait for initial snapshot
      await Schedule.waitFor(() => proxyDoc.current.count === 0);
      expect(proxyDoc.current.count).to.eql(0);

      // Change on real doc
      await real.doc.change((d) => (d.count = 123));

      // Wait for change to propagate
      await Schedule.waitFor(() => proxyDoc.current.count === 123);
      expect(proxyDoc.current.count).to.eql(123);

      await sample.dispose();
    });

    it('doc proxy change propagates to real doc', async () => {
      const sample = await Test.sample<D>({ count: 0 });
      const { proxy, real } = sample;

      const result = await proxy.repo.get<D>(real.doc.id);
      expect(result.ok).to.eql(true);
      const proxyDoc = result.doc!;

      // Wait for initial snapshot
      await Schedule.waitFor(() => proxyDoc.current.count === 0);

      // Change on proxy doc
      proxyDoc.change((d) => (d.count = 456));

      // Wait for change to propagate to real doc
      await Schedule.waitFor(() => real.doc.current.count === 456);
      expect(real.doc.current.count).to.eql(456);

      await sample.dispose();
    });

    it('repo.events() → emits ready$ when ready', async () => {
      const { port1, port2 } = Test.makePorts();
      const realRepo = Test.realRepo();

      CrdtWorkerCmd.Host.attach(port2, realRepo);
      const proxyRepo = CrdtWorkerCmd.Client.repo(port1);

      const events = proxyRepo.events();
      let readyEmitted = false;
      events.ready$.subscribe(() => (readyEmitted = true));

      await realRepo.whenReady();
      await Schedule.waitFor(() => readyEmitted);

      expect(readyEmitted).to.eql(true);
      expect(proxyRepo.status.ready).to.eql(true);

      events.dispose();
      await proxyRepo.dispose();
      await realRepo.dispose();
    });

    it('disposes cleanly', async () => {
      const { port1, port2 } = Test.makePorts();
      const realRepo = await Test.realRepo().whenReady();

      CrdtWorkerCmd.Host.attach(port2, realRepo);
      const proxyRepo = CrdtWorkerCmd.Client.repo(port1);
      await proxyRepo.whenReady();

      expect(proxyRepo.disposed).to.eql(false);
      await proxyRepo.dispose();
      expect(proxyRepo.disposed).to.eql(true);

      await realRepo.dispose();
    });
  },
);
