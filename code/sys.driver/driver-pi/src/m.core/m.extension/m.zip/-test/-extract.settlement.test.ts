import { Fs } from '@sys/fs';
import { FsCapability } from '@sys/fs/capability';
import { describe, expect, it, Schedule, type t, Time } from './common.ts';
import { withArchive, withRooted } from './u.fixture.extract.ts';
import { context, rejection } from './u.fixture.ts';
import { extractTool } from './u.fixture.tools.ts';

describe('Pi: ZIP extraction / settlement', () => {
  describe('queued work', () => {
    it('delayed admission → cancellation prevents later source work and mutation', async () => {
      await withArchive(async (root) => {
        const entered = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        const controller = new AbortController();
        let creates = 0;
        const queue: t.MutationQueue = async (_key, run) => {
          entered.resolve();
          await release.promise;
          return await run();
        };
        const rooted: t.FsRooted.Lib = {
          ...FsCapability.Rooted,
          create: (options) => {
            creates++;
            return FsCapability.Rooted.create(options);
          },
        };
        const tool = await extractTool(root, { queue, rooted });
        const pending = rejection(
          () =>
            tool.execute(
              'c',
              { path: 'absent.zip', to: 'unpacked' },
              controller.signal,
              undefined,
              context(root),
            ),
          'operation cancelled',
        );
        try {
          await entered.promise;
          controller.abort();
        } finally {
          release.resolve();
          await pending;
        }
        expect(creates).to.eql(0);
        expect(await Fs.exists(Fs.join(root, 'unpacked'))).to.eql(false);
      });
    });

    it('expired admission → work deadline wins before missing-source I/O', async () => {
      await withArchive(async (root) => {
        const queue: t.MutationQueue = async (_key, run) => {
          await Time.delay(30);
          return await run();
        };
        // Explicit test budget; production resolution remains fixed at 120 seconds.
        const tool = await extractTool(root, { queue, timeout: 10 as 120_000 });
        await rejection(
          () =>
            tool.execute(
              'timeout',
              { path: 'absent.zip', to: 'unpacked' },
              undefined,
              undefined,
              context(root),
            ),
          'timeout',
        );
        expect(await Fs.exists(Fs.join(root, 'unpacked'))).to.eql(false);
      });
    });
  });

  it('cancelled construction → queue remains owned until late Fs settlement and discard', async () => {
    await withArchive(async (root) => {
      const entered = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const controller = new AbortController();
      const events: string[] = [];
      const rooted = withRooted((actual) => ({
        ...actual,
        Stage: {
          ...actual.Stage,
          async create(options) {
            const stage = await actual.Stage.create(options);
            events.push('created');
            entered.resolve();
            await release.promise;
            events.push('returned');
            return stage;
          },
          async discard(stage, options) {
            expect(options?.until).to.eql(undefined);
            await actual.Stage.discard(stage, options);
            events.push('discarded');
          },
        },
      }));
      const queue: t.MutationQueue = async (_key, run) => {
        try {
          return await run();
        } finally {
          events.push('queue-released');
        }
      };
      const tool = await extractTool(root, { queue, rooted });
      const pending = rejection(
        () =>
          tool.execute(
            'active',
            { path: 'a.zip', to: 'unpacked' },
            controller.signal,
            undefined,
            context(root),
          ),
        'operation cancelled',
      );
      try {
        await entered.promise;
        controller.abort();
        await Schedule.tick();
        expect(events).to.eql(['created']);
      } finally {
        release.resolve();
        await pending;
      }
      expect(events).to.eql(['created', 'returned', 'discarded', 'queue-released']);
      expect(await Fs.exists(Fs.join(root, 'unpacked'))).to.eql(false);
    });
  });
});
