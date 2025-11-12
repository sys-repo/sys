import {
  type t,
  Obj,
  Rx,
  Schedule,
  afterEach,
  describe,
  expect,
  expectTypeOf,
  it,
} from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';
import { Wait, createTestHelpers } from './-u.ts';

describe('CrdtWorker.repo (shim)', () => {
  const Test = createTestHelpers();

  afterEach(async () => {
    Test.clearPorts();
    await Schedule.macro();
  });

  describe('smoke', () => {
    it('smoke: real repo over MessagePort → stream/open + ready + live', async () => {
      const { port1, port2 } = Test.makePorts();
      const real = Test.realRepo();

      const client = CrdtWorker.repo(port1);
      const { events, stop } = Test.collectRepoEvents(port1);

      CrdtWorker.attach(port2, real);

      // stream/open first
      await Wait.waitFor(() => events.length >= 1);
      expect(events[0]).to.eql({ type: 'stream/open', payload: {} });

      // at least one ready; client resolves
      await Wait.waitFor(() => events.some((e) => e.type === 'ready'));
      await client.whenReady();
      expect(client.ready).to.eql(true);

      stop();
      await real.dispose();
      await client.dispose();
    });

    it('client mirrors id from props/snapshot', async () => {
      const client = Test.clientRepo();
      const real = Test.realRepo();

      CrdtWorker.attach(client.port2, real);
      await Wait.waitFor(() => Obj.hash(client.repo.id) === Obj.hash(real.id));

      expect(client.repo.id.instance).to.eql(real.id.instance);
      expect(client.repo.id.peer).to.eql(real.id.peer);

      await real.dispose();
    });
  });

  describe('construct (core invariants)', () => {
    it('exposes a t.CrdtRepo surface (structural typing)', async () => {
      const { port1, port2 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1);
      // Type-level: should be assignable to t.CrdtRepo
      expectTypeOf(repo).toMatchTypeOf<t.CrdtRepo>();

      repo.dispose();
    });

    it('branding: via === "worker" (stable discriminant)', () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1);
      expect((repo as t.CrdtRepoWorkerShim).via).to.eql('worker');
    });

    it('lifecycle: dispose emits once, sets disposed, and is idempotent', async () => {
      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1);

      const fired: t.DisposeAsyncEvent[] = [];
      repo.dispose$.subscribe((e) => fired.push(e));
      expect(repo.disposed).to.eql(false);

      await repo.dispose();
      expect(repo.disposed).to.eql(true);
      expect(fired.map((e) => e.payload.stage)).to.eql(['start', 'complete']);

      // Idempotent:
      await repo.dispose();
      expect(repo.disposed).to.eql(true);
      expect(fired.length).to.eql(2);
    });

    it('lifecycle: dispose via `until` parameter option', async () => {
      const until = Rx.lifecycle();

      const { port1 } = Test.makePorts();
      const repo = CrdtWorker.repo(port1, { until });
      expect(repo.disposed).to.eql(false);

      until.dispose();
      expect(repo.disposed).to.eql(false);
      await Schedule.micro();
      expect(repo.disposed).to.eql(true);
    });
  });
});
