import { afterEach, describe, expect, expectTypeOf, it, type t, Time } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { cmd, expectFilesFsError } from './u.fixture.ts';
import { allowAllLivePolicy, allowDocsLivePolicy, setupLive } from './u.fixture.live.ts';

type WatchContext = {
  readonly context: t.Cmd.Handler.Context<
    t.FilesCmd.Name,
    t.FilesCmd.Event,
    t.FilesCmd.Name.Watch
  >;
  readonly stop: () => void;
};

type ChangeMatch = {
  readonly path: t.Files.String.Path;
  readonly kind?: t.Files.Change['kind'];
  readonly afterSeq?: number;
  readonly entrySize?: number;
};

type LiveSetup = Awaited<ReturnType<typeof setupLive>>;
type SetupInput = Parameters<typeof setupLive>[0];

const activeWatchContexts = new Set<WatchContext>();

describe('FilesFs.live', () => {
  const setups = new Set<LiveSetup>();

  afterEach(async () => {
    for (const watcher of [...activeWatchContexts]) watcher.stop();
    await Promise.all([...setups].map((setup) => setup.dispose()));
    setups.clear();
  });

  const setup = async (options: SetupInput = {}) => {
    const res = await setupLive(options);
    setups.add(res);
    return res;
  };
  it('creates a bounded live backing with readonly truth and watch diagnostics', async () => {
    const { backing } = await setup({
      policy: allowDocsLivePolicy,
      maxReadBytes: 64,
      defaultLimit: 2,
    });

    expect(backing.kind).to.eql('files/fs:live');
    expect(Object.isFrozen(backing.policy)).to.eql(true);
    expect(Object.isFrozen(backing.capabilities)).to.eql(true);
    expect(Object.isFrozen(backing.handlers)).to.eql(true);
    expect(Object.isFrozen(backing.diagnostics)).to.eql(true);
    expect(Object.isFrozen(backing.diagnostics.Active)).to.eql(true);

    for (const name of ['fs', 'root', 'watch', 'testing']) {
      expect(backing).to.not.have.property(name);
    }

    expectTypeOf(backing).toEqualTypeOf<t.FilesFs.Live>();
    expect(await cmd.capabilities(backing)).to.eql({
      list: true,
      stat: true,
      read: true,
      write: false,
      remove: false,
      watch: true,
      manifest: true,
      fidelity: 'live',
      maxReadBytes: 64,
      encodings: ['utf8'],
    });
  });

  it('keeps live watch separate from write/remove authority', async () => {
    const { backing } = await setup({
      policy: {
        ...allowAllLivePolicy,
        write: '**',
        remove: '**',
      },
    });

    expect(await cmd.capabilities(backing)).to.include({
      write: false,
      remove: false,
      watch: true,
      fidelity: 'live',
    });
    await expectFilesFsError(
      () => cmd.write(backing, { kind: 'text', path: 'docs/new.md', content: 'nope\n' }),
      'FilesFsError.Unsupported',
    );
    await expectFilesFsError(
      () => cmd.remove(backing, { path: 'docs/readme.md' }),
      'FilesFsError.Unsupported',
    );
  });

  it('emits filesystem change hints while list/stat/read remain truth', async () => {
    const { backing, writeText, remove } = await setup({ policy: allowAllLivePolicy });
    const events: t.Files.Change[] = [];
    const watcher = watchContext(events);
    const done = backing.handlers['files:watch']({ path: 'docs' }, watcher.context);

    await waitForActive(backing);

    await writeText('docs/new.md' as t.Files.String.Path, 'new\n');
    const first = await waitForChange(events, {
      path: 'docs/new.md' as t.Files.String.Path,
      entrySize: 4,
    });
    expect(['created', 'modified'].includes(first.kind)).to.eql(true);
    expect(first.entry).to.eql({ path: 'docs/new.md', kind: 'file', size: 4 });
    expect(await cmd.read(backing, { path: 'docs/new.md' })).to.eql({
      kind: 'inline',
      file: { path: 'docs/new.md', kind: 'file', size: 4 },
      encoding: 'utf8',
      content: 'new\n',
    });

    const beforeModify = lastSeq(events);
    await writeText('docs/new.md' as t.Files.String.Path, 'newer\n');
    const modified = await waitForChange(events, {
      path: 'docs/new.md' as t.Files.String.Path,
      afterSeq: beforeModify,
      entrySize: 6,
    });
    expect(['created', 'modified'].includes(modified.kind)).to.eql(true);
    expect(modified.entry).to.eql({ path: 'docs/new.md', kind: 'file', size: 6 });
    expect(await cmd.read(backing, { path: 'docs/new.md' })).to.eql({
      kind: 'inline',
      file: { path: 'docs/new.md', kind: 'file', size: 6 },
      encoding: 'utf8',
      content: 'newer\n',
    });

    const beforeDelete = lastSeq(events);
    await remove('docs/new.md' as t.Files.String.Path);
    const deleted = await waitForChange(events, {
      path: 'docs/new.md' as t.Files.String.Path,
      kind: 'deleted',
      afterSeq: beforeDelete,
    });
    expect(deleted).to.include({ kind: 'deleted', path: 'docs/new.md' });
    await expectFilesFsError(
      () => cmd.stat(backing, { path: 'docs/new.md' }),
      'FilesFsError.NotFound',
    );

    watcher.stop();
    const result = await done;
    expect(result.ok).to.eql(true);
    expect(Files.Cursor.Is.watch(result.cursor)).to.eql(true);
    expect(backing.diagnostics.Active.watchCount()).to.eql(0);
  });

  it('filters watch hints through policy, scope, match, and exclude', async () => {
    const { backing, writeText } = await setup({ policy: allowDocsLivePolicy });
    const events: t.Files.Change[] = [];
    const watcher = watchContext(events);
    const done = backing.handlers['files:watch'](
      { path: 'docs', match: '**/*.md', exclude: 'docs/draft.md' },
      watcher.context,
    );

    await waitForActive(backing);

    await writeText('docs/readme.md' as t.Files.String.Path, 'visible\n');
    await writeText('docs/draft.md' as t.Files.String.Path, 'excluded\n');
    await writeText('other/readme.md' as t.Files.String.Path, 'outside\n');
    await writeText('docs/data.json' as t.Files.String.Path, '{}\n');

    await waitForChange(events, { path: 'docs/readme.md' as t.Files.String.Path });
    await Time.wait(80);
    expect(events.length > 0).to.eql(true);
    expect(events.every((event) => event.path === 'docs/readme.md')).to.eql(true);

    watcher.stop();
    await done;
  });

  it('supports multiple active watchers and per-stream cancellation', async () => {
    const { backing, writeText } = await setup({ policy: allowAllLivePolicy });
    const docsEvents: t.Files.Change[] = [];
    const markdownEvents: t.Files.Change[] = [];
    const docs = watchContext(docsEvents);
    const markdown = watchContext(markdownEvents);
    const docsDone = backing.handlers['files:watch']({ path: 'docs' }, docs.context);
    const markdownDone = backing.handlers['files:watch'](
      { path: 'docs', match: '**/*.md' },
      markdown.context,
    );

    await waitFor(() => backing.diagnostics.Active.watchCount() === 2);

    await writeText('docs/readme.md' as t.Files.String.Path, 'hello\n');
    await waitForChange(docsEvents, { path: 'docs/readme.md' as t.Files.String.Path });
    await waitForChange(markdownEvents, { path: 'docs/readme.md' as t.Files.String.Path });

    docs.stop();
    await docsDone;
    expect(backing.diagnostics.Active.watchCount()).to.eql(1);

    const docsCountAfterStop = docsEvents.length;
    await writeText('docs/next.md' as t.Files.String.Path, 'next\n');
    await waitForChange(markdownEvents, { path: 'docs/next.md' as t.Files.String.Path });
    await Time.wait(80);
    expect(docsEvents.slice(docsCountAfterStop).some((event) => event.path === 'docs/next.md'))
      .to.eql(false);
    expect(markdownEvents.some((event) => event.path === 'docs/next.md')).to.eql(true);

    markdown.stop();
    await markdownDone;
    expect(backing.diagnostics.Active.watchCount()).to.eql(0);
  });

  it('keeps truth when a watch subscriber rejects a hint', async () => {
    const { backing, writeText } = await setup({ policy: allowAllLivePolicy });
    const watcher = watchContext([]);
    const context = {
      ...watcher.context,
      emit() {
        throw new Error('subscriber failed');
      },
    };
    const done = backing.handlers['files:watch']({ path: 'docs' }, context);

    await waitForActive(backing);
    await writeText('docs/fault.md' as t.Files.String.Path, 'ok');
    await Time.wait(80);

    expect(backing.diagnostics.Active.watchCount()).to.eql(1);
    expect(await cmd.read(backing, { path: 'docs/fault.md' })).to.eql({
      kind: 'inline',
      file: { path: 'docs/fault.md', kind: 'file', size: 2 },
      encoding: 'utf8',
      content: 'ok',
    });

    watcher.stop();
    await done;
  });

  it('omits event entry metadata when stat policy is not granted', async () => {
    const { backing, writeText } = await setup({
      policy: { list: '**', read: '**', watch: '**', manifest: true },
    });
    const events: t.Files.Change[] = [];
    const watcher = watchContext(events);
    const done = backing.handlers['files:watch']({}, watcher.context);

    await waitForActive(backing);
    await writeText('docs/no-stat.md' as t.Files.String.Path, 'hello\n');

    const event = await waitForChange(events, { path: 'docs/no-stat.md' as t.Files.String.Path });
    expect(event.path).to.eql('docs/no-stat.md');
    expect(event).to.not.have.property('entry');

    watcher.stop();
    await done;
  });

  it('rejects invalid or unauthorized watch commands before subscribing', async () => {
    const denied = await setup();
    await expectFilesFsError(
      () => cmd.watch(denied.backing, { path: 'docs' }),
      'FilesFsError.PolicyDenied',
    );
    expect(denied.backing.diagnostics.Active.watchCount()).to.eql(0);

    const { backing } = await setup({ policy: allowAllLivePolicy });
    await expectFilesFsError(
      () => cmd.watch(backing, { path: 'missing' }),
      'FilesFsError.NotFound',
    );
    await expectFilesFsError(
      () => cmd.watch(backing, { path: 'docs/readme.md' }),
      'FilesFsError.NotDirectory',
    );
    await expectFilesFsError(
      () => cmd.watch(backing, { match: [123] as never }),
      'FilesFsError.InvalidPath',
    );
    expect(backing.diagnostics.Active.watchCount()).to.eql(0);
  });
});

async function waitForActive(backing: t.FilesFs.Live): Promise<void> {
  await backing.diagnostics.Active.whenActive();
  await Time.wait(20);
}

async function waitForChange(
  events: t.Files.Change[],
  match: ChangeMatch,
  timeout = 1000,
  interval = 10,
): Promise<t.Files.Change> {
  let found: t.Files.Change | undefined;
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

async function waitFor(fn: () => boolean, timeout = 1000, interval = 10): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (fn()) return;
    await Time.wait(interval);
  }
  throw new Error(`Timed out waiting for FilesFs.live test condition (${timeout}ms).`);
}

function changeMatches(event: t.Files.Change, match: ChangeMatch): boolean {
  if (event.path !== match.path) return false;
  if (match.kind && event.kind !== match.kind) return false;
  if (match.afterSeq !== undefined && Number(event.seq) <= match.afterSeq) return false;
  if (match.entrySize !== undefined) {
    if (event.entry?.kind !== 'file') return false;
    return event.entry.size === match.entrySize;
  }
  return true;
}

function lastSeq(events: readonly t.Files.Change[]): number {
  return Number(events.at(-1)?.seq ?? 0);
}

function watchContext(events: t.Files.Change[]): WatchContext {
  const controller = new AbortController();
  const context: t.Cmd.Handler.Context<
    t.FilesCmd.Name,
    t.FilesCmd.Event,
    t.FilesCmd.Name.Watch
  > = {
    id: 'req-files-fs-live-test' as t.Cmd.ReqId,
    name: Files.Cmd.Name.watch,
    ns: Files.Cmd.ns,
    signal: controller.signal,
    emit(event) {
      events.push(event);
    },
  };
  let stopped = false;
  const watcher: WatchContext = {
    context,
    stop() {
      if (stopped) return;
      stopped = true;
      activeWatchContexts.delete(watcher);
      controller.abort('test.stop');
    },
  };
  activeWatchContexts.add(watcher);
  return watcher;
}
