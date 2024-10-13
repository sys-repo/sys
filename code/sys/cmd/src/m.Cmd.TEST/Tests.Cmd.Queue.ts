import { Cmd } from '../mod.ts';
import { DEFAULTS, Time, type t } from './common.ts';

import type { C } from './t.ts';

export function queueTests(setup: t.CmdTestSetup, args: t.TestArgs) {
  const { describe, it, expect } = args;

  describe('Cmd.Queue', () => {
    const setupQueue = async () => {
      const { factory, dispose, dispose$ } = await setup();
      const doc = await factory();
      const cmd = Cmd.create<C>(doc);
      const method = cmd.method('Foo');
      const resolve = Cmd.Path.resolver();

      const foo = {
        method,
        invoked: 0,
        async invoke(times = 1) {
          for (let i = 0; i < times; i++) {
            foo.invoked++;
            method({ foo: foo.invoked });
            await Time.wait(10);
          }
        },
      };

      const current = {
        get queue() {
          return resolve.queue.list(doc.current);
        },
        get log() {
          return resolve.log(doc.current);
        },
        get object() {
          return resolve.toObject(doc.current);
        },
      } as const;

      const expectQueue = (total: number, assert = true) => {
        const queue = current.queue;
        if (assert) expect(queue.length).to.eql(total);
      };

      return {
        doc,
        cmd,
        method,
        resolve,
        dispose,
        dispose$,
        expectQueue,
        foo,
        current,
      } as const;
    };

    it('baseline: the queue grows', async () => {
      const { dispose, foo, expectQueue } = await setupQueue();

      expectQueue(0);
      await foo.invoke();
      expectQueue(1);

      await foo.invoke(10);
      expectQueue(11);

      dispose();
    });

    describe('Queue.totals', () => {
      it('empty (initial)', async () => {
        const { dispose, cmd } = await setupQueue();
        const total = Cmd.Queue.totals(cmd);

        expect(total.purged).to.eql(0);
        expect(total.current).to.eql(0);
        expect(total.complete).to.eql(0);

        dispose();
      });

      it('purged', async () => {
        const { dispose, foo, cmd } = await setupQueue();

        await foo.invoke(10);
        Cmd.Queue.purge(cmd, { min: 3 });

        const total = Cmd.Queue.totals(cmd);
        expect(total.purged).to.eql(7);
        expect(total.current).to.eql(3);
        expect(total.complete).to.eql(10);

        dispose();
      });
    });

    describe('Queue.purge', () => {
      it('.purge ← {min} empty', async () => {
        const { dispose, foo, expectQueue, current, cmd } = await setupQueue();

        await foo.invoke(5);
        expectQueue(5);
        expect(current.log.total.purged).to.eql(0);

        const purged = Cmd.Queue.purge(cmd, { min: 0 });
        const total = Cmd.Queue.totals(cmd);
        expectQueue(0);
        expect(purged).to.eql(5);
        expect(total.purged).to.eql(5);
        expect(total.current).to.eql(0);
        expect(total.complete).to.eql(5);

        dispose();
      });

      it('.purge ← {min} retains items', async () => {
        const { dispose, foo, expectQueue, current, cmd } = await setupQueue();

        await foo.invoke(5);
        expectQueue(5);
        expect(current.log.total.purged).to.eql(0);

        const purged = Cmd.Queue.purge(cmd, { min: 2 });
        expectQueue(2);
        expect(purged).to.eql(3);
        expect(current.queue.map((e) => e.params.foo)).to.eql([4, 5]);

        dispose();
      });
    });

    describe('monitor', () => {
      it('monitor: default', async () => {
        const { dispose, cmd, dispose$ } = await setupQueue();
        const monitor = Cmd.Queue.autopurge(cmd, { dispose$ });

        const BOUNDS = DEFAULTS.queue.bounds;
        expect(monitor.bounds.min).to.eql(BOUNDS.min);
        expect(monitor.bounds.max).to.eql(BOUNDS.max);
        dispose();
      });

      it('monitor: custom bounds', async () => {
        const { dispose, cmd, dispose$ } = await setupQueue();
        const monitor = Cmd.Queue.autopurge(cmd, { max: 10, min: 3, dispose$ });
        expect(monitor.bounds.min).to.eql(3);
        expect(monitor.bounds.max).to.eql(10);
        dispose();
      });

      it('monitor: auto purges', async () => {
        const { dispose, foo, expectQueue, cmd, dispose$ } = await setupQueue();
        const monitor = Cmd.Queue.autopurge(cmd, { min: 0, max: 10, dispose$ });

        await foo.invoke(9);
        expectQueue(9);
        expect(monitor.total.purged).to.eql(0);

        await foo.invoke(); // NB: one more triggers purge
        expectQueue(0);
        expect(monitor.total.purged).to.eql(10);

        await foo.invoke(3);
        expectQueue(3);
        expect(monitor.total.purged).to.eql(10); // NB: no change.

        dispose();
      });

      it('monitor: auto purges ← {min} retained', async () => {
        const { dispose, foo, expectQueue, cmd, dispose$ } = await setupQueue();
        const monitor = Cmd.Queue.autopurge(cmd, { max: 10, min: 3, dispose$ });

        await foo.invoke(9);
        expectQueue(9);
        expect(monitor.total.purged).to.eql(0);

        await foo.invoke(); // NB: one more triggers purge
        expectQueue(3);
        expect(monitor.total.purged).to.eql(7);

        dispose();
      });

      it('lifecycle: dispose', async () => {
        const { dispose, cmd, dispose$ } = await setupQueue();
        const monitor1 = Cmd.Queue.autopurge(cmd, { dispose$ });
        const monitor2 = Cmd.Queue.autopurge(cmd, {});

        expect(monitor1.disposed).to.eql(false);
        expect(monitor2.disposed).to.eql(false);

        dispose();
        expect(monitor1.disposed).to.eql(true);
        expect(monitor2.disposed).to.eql(false);

        monitor2.dispose();
        expect(monitor1.disposed).to.eql(true);
        expect(monitor2.disposed).to.eql(true);
      });
    });
  });
}
