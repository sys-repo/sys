import type { Cmd as TCmd } from '@sys/event/t';
import type { t as TModel } from '@sys/model';
import { Files } from '@sys/model/files/fs';

import { describe, expect, expectTypeOf, it, type t, Time } from '../../-test.ts';
import { Fs } from '../../mod.ts';
import { context, expectFilesFsError, POLICY, setupFixture } from './u.fixture.ts';

type WatchContext = {
  readonly context: TCmd.Handler.Context<
    TModel.Files.Cmd.Name,
    TModel.Files.Cmd.Event,
    TModel.Files.Cmd.Name.Watch
  >;
  readonly stop: () => void;
};

type ChangeMatch = {
  readonly path: TModel.Files.String.Path;
  readonly kind?: TModel.Files.Change['kind'];
  readonly afterSeq?: number;
  readonly entrySize?: number;
};

const LIVE_POLICY = {
  ...POLICY,
  watch: '**',
} satisfies TModel.Files.Policy.Shape;

describe('Fs.Capability.Files.Readonly.live', () => {
  it('adapts @sys/fs to the live files/fs capability without write/remove authority', async () => {
    const fixture = await setupFixture();
    try {
      const cap = Fs.Capability.Files.Readonly.live(Fs);
      expectTypeOf(cap).toMatchTypeOf<TModel.FilesFs.Capability.Live>();
      expect('write' in cap).to.eql(false);
      expect('remove' in cap).to.eql(false);

      const backing = Files.Fs.Readonly.live({ fs: cap, root: fixture.root, policy: LIVE_POLICY });
      expect(backing.capabilities).to.include({
        list: true,
        stat: true,
        read: true,
        write: false,
        remove: false,
        watch: true,
        manifest: true,
        fidelity: 'live',
      });

      const read = await backing.handlers['files:read'](
        { path: 'docs/readme.md' },
        context('files:read'),
      );
      expect(read).to.eql({
        kind: 'inline',
        file: { path: 'docs/readme.md', kind: 'file', size: 6 },
        encoding: 'utf8',
        content: 'hello\n',
      });
    } finally {
      await Fs.remove(fixture.workspace);
    }
  });

  it('projects real Fs.watch events through FilesFs.Readonly.live while list/stat/read remain truth', async () => {
    const fixture = await setupFixture();
    const events: TModel.Files.Change[] = [];
    const watcher = watchContext(events);
    let done: Promise<TModel.Files.Cmd.Watch.Result> | undefined;

    try {
      const cap = Fs.Capability.Files.Readonly.live(Fs);
      const backing = Files.Fs.Readonly.live({ fs: cap, root: fixture.root, policy: LIVE_POLICY });
      const started = Promise.resolve(
        backing.handlers['files:watch']({ path: 'docs' }, watcher.context),
      );
      done = started;

      await waitForActive(backing);
      await Deno.writeTextFile(Fs.join(fixture.root, 'docs', 'live.md'), 'live\n');

      const event = await waitForChange(events, {
        path: 'docs/live.md' as TModel.Files.String.Path,
        entrySize: 5,
      });
      expect(['created', 'modified'].includes(event.kind)).to.eql(true);
      expect(event.entry).to.eql({ path: 'docs/live.md', kind: 'file', size: 5 });

      const read = await backing.handlers['files:read'](
        { path: 'docs/live.md' },
        context('files:read'),
      );
      expect(read).to.eql({
        kind: 'inline',
        file: { path: 'docs/live.md', kind: 'file', size: 5 },
        encoding: 'utf8',
        content: 'live\n',
      });

      watcher.stop();
      const result = await started;
      expect(result.ok).to.eql(true);
      expect(backing.diagnostics.Active.watchCount()).to.eql(0);
    } finally {
      watcher.stop();
      await done?.catch(() => undefined);
      await Fs.remove(fixture.workspace);
    }
  });

  it('does not widen watch authority through directory symlink escapes', async () => {
    const fixture = await setupFixture();
    const watcher = watchContext([]);
    try {
      await Deno.symlink(fixture.outsideDir, fixture.dirLink, { type: 'dir' });

      const cap = Fs.Capability.Files.Readonly.live(Fs);
      const backing = Files.Fs.Readonly.live({ fs: cap, root: fixture.root, policy: LIVE_POLICY });

      await expectFilesFsError(
        () => backing.handlers['files:watch']({ path: 'docs/leak-dir' }, watcher.context),
        'FilesFsError.PathOutsideRoot',
        fixture,
      );
      expect(backing.diagnostics.Active.watchCount()).to.eql(0);
    } finally {
      watcher.stop();
      await Fs.remove(fixture.workspace);
    }
  });

  it('disposes the underlying Fs watcher when the Files watch stops', async () => {
    const fixture = await setupFixture();
    const active = new Set<t.Watch.Instance>();
    const fs = {
      ...Fs,
      watch: async (...args: Parameters<t.Fs.Lib['watch']>) => {
        const watcher = await Fs.watch(...args);
        active.add(watcher);
        return watcher;
      },
    } satisfies t.Fs.Lib;
    const watcher = watchContext([]);
    let done: Promise<TModel.Files.Cmd.Watch.Result> | undefined;

    try {
      const cap = Fs.Capability.Files.Readonly.live(fs);
      const backing = Files.Fs.Readonly.live({ fs: cap, root: fixture.root, policy: LIVE_POLICY });
      const started = Promise.resolve(
        backing.handlers['files:watch']({ path: 'docs' }, watcher.context),
      );
      done = started;

      await waitFor(() => active.size === 1 && [...active].every((item) => !item.disposed));
      expect(backing.diagnostics.Active.watchCount()).to.eql(1);

      watcher.stop();
      await started;

      expect([...active].every((item) => item.disposed)).to.eql(true);
      expect(backing.diagnostics.Active.watchCount()).to.eql(0);
    } finally {
      watcher.stop();
      await done?.catch(() => undefined);
      await Fs.remove(fixture.workspace);
    }
  });
});

async function waitForActive(backing: TModel.FilesFs.Live): Promise<void> {
  await backing.diagnostics.Active.whenActive();
  await Time.wait(20);
}

async function waitForChange(
  events: TModel.Files.Change[],
  match: ChangeMatch,
  timeout = 1200,
  interval = 20,
): Promise<TModel.Files.Change> {
  let found: TModel.Files.Change | undefined;
  await waitFor(
    () => {
      found = events.find((event) => changeMatches(event, match));
      return found !== undefined;
    },
    timeout,
    interval,
  );
  return found!;
}

async function waitFor(fn: () => boolean, timeout = 1200, interval = 20): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (fn()) return;
    await Time.wait(interval);
  }
  throw new Error(`Timed out waiting for Files live bridge test condition (${timeout}ms).`);
}

function changeMatches(event: TModel.Files.Change, match: ChangeMatch): boolean {
  if (event.path !== match.path) return false;
  if (match.kind && event.kind !== match.kind) return false;
  if (match.afterSeq !== undefined && Number(event.seq) <= match.afterSeq) return false;
  if (match.entrySize !== undefined) {
    if (event.entry?.kind !== 'file') return false;
    return event.entry.size === match.entrySize;
  }
  return true;
}

function watchContext(events: TModel.Files.Change[]): WatchContext {
  const controller = new AbortController();
  const context: WatchContext['context'] = {
    id: 'req-files-fs-live-bridge-test' as TCmd.ReqId,
    name: Files.Cmd.Name.watch,
    ns: Files.Cmd.ns,
    signal: controller.signal,
    emit(event) {
      events.push(event);
    },
  };
  let stopped = false;
  return {
    context,
    stop() {
      if (stopped) return;
      stopped = true;
      controller.abort('test.stop');
    },
  };
}
