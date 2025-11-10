import {
  type t,
  Rx,
  Schedule,
  afterEach,
  describe,
  expect,
  expectTypeOf,
  it,
} from '../../-test.ts';
import { WIRE_VERSION } from '../common.ts';
import { CrdtWorker } from '../mod.ts';

describe('CrdtWorker.repo (shim)', () => {
  const ports = new Set<MessagePort>();
  const makePorts = () => {
    const channel = new MessageChannel();
    ports.add(channel.port1);
    ports.add(channel.port2);
    return channel;
  };
  const makeRepo = () => {
    const { port1, port2 } = makePorts();
    return { repo: CrdtWorker.repo(port1), port2 } as const;
  };
  afterEach(() => {
    ports.forEach((p) => p.close());
    ports.clear();
  });

  it('API', () => {
    expect(CrdtWorker.version).to.eql(WIRE_VERSION);
  });

  describe('construct (core invariants)', () => {
    it('exposes a t.CrdtRepo surface (structural typing)', async () => {
      const { port1 } = makePorts();
      const repo = CrdtWorker.repo(port1);
      // Type-level: should be assignable to t.CrdtRepo
      expectTypeOf(repo).toMatchTypeOf<t.CrdtRepo>();

      // Runtime identity contract that will remain true:
      expect(await repo.whenReady()).to.equal(repo);
    });

    it('branding: via === "worker" (stable discriminant)', () => {
      const { port1 } = makePorts();
      const repo = CrdtWorker.repo(port1);
      expect((repo as t.CrdtRepoWorkerShim).via).to.eql('worker');
    });

    it('lifecycle: dispose emits once, sets disposed, and is idempotent', async () => {
      const { port1 } = makePorts();
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

      const { port1 } = makePorts();
      const repo = CrdtWorker.repo(port1, { until });
      expect(repo.disposed).to.eql(false);

      until.dispose();
      expect(repo.disposed).to.eql(false);
      await Schedule.micro();
      expect(repo.disposed).to.eql(true);
    });
  });
});
