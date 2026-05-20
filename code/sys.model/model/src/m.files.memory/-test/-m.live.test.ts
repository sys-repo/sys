import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { FilesMemory } from '../mod.ts';
import { createLiveForTesting } from './u.live.ts';
import { cmd, expectFilesMemoryError } from './u.fixture.ts';

describe('FilesMemory.live', () => {
  it('creates a bounded live backing without changing the readonly surface', async () => {
    const backing = FilesMemory.live({
      files: { 'docs/readme.md': 'hello\n' },
      policy: Files.Policy.readonly('**'),
      maxReadBytes: 64,
    });

    expect(backing.kind).to.eql('files/memory:live');
    expect(Object.isFrozen(backing.policy)).to.eql(true);
    expect(Object.isFrozen(backing.capabilities)).to.eql(true);
    expect(Object.isFrozen(backing.handlers)).to.eql(true);
    expect(Object.isFrozen(backing.diagnostics)).to.eql(true);
    expect(Object.isFrozen(backing.diagnostics.Active)).to.eql(true);

    // Boundary: public live backing exposes Cmd handlers and diagnostics, not owner/test internals.
    for (const name of ['files', 'mutate', 'root', 'testing', 'watch']) {
      expect(backing).to.not.have.property(name);
    }

    expectTypeOf(backing).toEqualTypeOf<t.FilesMemory.Live>();
    expect(await cmd.capabilities(backing)).to.eql({
      list: true,
      stat: true,
      read: true,
      watch: true,
      manifest: true,
      fidelity: 'live',
      maxReadBytes: 64,
      encodings: ['utf8'],
    });
  });

  it('emits created, modified, and deleted change hints while list/stat/read remain truth', async () => {
    const { backing, testing } = createLiveForTesting({
      files: { 'docs/readme.md': 'hello\n' },
      policy: Files.Policy.readonly('**'),
    });
    const events: t.Files.Change[] = [];
    const { context, stop } = watchContext(events);
    const done = backing.handlers['files:watch']({ path: 'docs' }, context);

    await backing.diagnostics.Active.whenActive();

    const modifiedAt = 1_700_000_000_000 as t.UnixTimestamp;
    await testing.mutate.writeText('docs/new.md', 'new\n', {
      mediaType: 'text/markdown',
      modifiedAt,
    });
    expect(events).to.eql([
      {
        kind: 'created',
        path: 'docs/new.md',
        seq: 1,
        entry: {
          path: 'docs/new.md',
          kind: 'file',
          size: 4,
          modifiedAt,
          mediaType: 'text/markdown',
        },
      },
    ]);
    expect(await cmd.read(backing, { path: 'docs/new.md' })).to.eql({
      kind: 'inline',
      file: { path: 'docs/new.md', kind: 'file', size: 4, modifiedAt, mediaType: 'text/markdown' },
      encoding: 'utf8',
      content: 'new\n',
    });

    await testing.mutate.writeText('docs/new.md', 'newer\n');
    expect(events.at(-1)).to.eql({
      kind: 'modified',
      path: 'docs/new.md',
      seq: 2,
      entry: { path: 'docs/new.md', kind: 'file', size: 6 },
    });
    expect(await cmd.read(backing, { path: 'docs/new.md' })).to.eql({
      kind: 'inline',
      file: { path: 'docs/new.md', kind: 'file', size: 6 },
      encoding: 'utf8',
      content: 'newer\n',
    });

    await testing.mutate.remove('docs/new.md');
    expect(events.at(-1)).to.eql({ kind: 'deleted', path: 'docs/new.md', seq: 3 });
    await expectFilesMemoryError(
      () => cmd.stat(backing, { path: 'docs/new.md' }),
      'FilesMemoryError.NotFound',
    );

    stop();
    const result = await done;
    expect(result.ok).to.eql(true);
    expect(Files.Cursor.Is.watch(result.cursor)).to.eql(true);
    expect(backing.diagnostics.Active.watchCount()).to.eql(0);
  });

  it('filters watch hints through policy, scope, match, and exclude', async () => {
    const deny = ['docs/secret/**'];
    const policy = {
      list: '**',
      stat: '**',
      read: '**',
      watch: '**',
      manifest: true,
      deny,
    } satisfies t.FilesPolicy.Shape;
    const { backing, testing } = createLiveForTesting({
      files: { 'docs/readme.md': 'hello\n' },
      policy,
    });
    deny.length = 0;
    (policy as Record<string, unknown>).watch = 'other/**';
    const events: t.Files.Change[] = [];
    const { context, stop } = watchContext(events);
    const done = backing.handlers['files:watch'](
      { path: 'docs', match: '**/*.md', exclude: 'docs/draft.md' },
      context,
    );

    await backing.diagnostics.Active.whenActive();
    await testing.mutate.writeText('docs/readme.md', 'visible\n');
    await testing.mutate.writeText('docs/draft.md', 'excluded\n');
    await testing.mutate.writeText('docs/secret/readme.md', 'denied\n');
    await testing.mutate.writeText('other/readme.md', 'outside scope\n');
    await testing.mutate.writeText('docs/data.json', '{}\n');

    expect(events.map((event) => event.path)).to.eql(['docs/readme.md']);
    expect(events[0].kind).to.eql('modified');

    stop();
    await done;
  });

  it('supports multiple active watchers and per-stream cancellation', async () => {
    const { backing, testing } = createLiveForTesting({
      dirs: ['docs'],
      policy: Files.Policy.readonly('**'),
    });
    const docsEvents: t.Files.Change[] = [];
    const markdownEvents: t.Files.Change[] = [];
    const docs = watchContext(docsEvents);
    const markdown = watchContext(markdownEvents);
    const docsDone = backing.handlers['files:watch']({ path: 'docs' }, docs.context);
    const markdownDone = backing.handlers['files:watch'](
      { path: 'docs', match: '**/*.md' },
      markdown.context,
    );

    await backing.diagnostics.Active.whenActive();
    expect(backing.diagnostics.Active.watchCount()).to.eql(2);

    await testing.mutate.writeText('docs/readme.md', 'hello\n');
    expect(docsEvents.map((event) => event.path)).to.eql(['docs/readme.md']);
    expect(markdownEvents.map((event) => event.path)).to.eql(['docs/readme.md']);

    docs.stop();
    await docsDone;
    expect(backing.diagnostics.Active.watchCount()).to.eql(1);

    await testing.mutate.writeText('docs/next.md', 'next\n');
    expect(docsEvents.map((event) => event.path)).to.eql(['docs/readme.md']);
    expect(markdownEvents.map((event) => event.path)).to.eql(['docs/readme.md', 'docs/next.md']);

    markdown.stop();
    await markdownDone;
    expect(backing.diagnostics.Active.watchCount()).to.eql(0);
  });

  it('omits event entry metadata when stat policy is not granted', async () => {
    const { backing, testing } = createLiveForTesting({
      policy: { list: '**', read: '**', watch: '**', manifest: true },
    });
    const events: t.Files.Change[] = [];
    const { context, stop } = watchContext(events);
    const done = backing.handlers['files:watch']({}, context);

    await backing.diagnostics.Active.whenActive();
    await testing.mutate.writeText('docs/readme.md', 'hello\n');

    expect(events).to.eql([{ kind: 'created', path: 'docs/readme.md', seq: 1 }]);

    stop();
    await done;
  });

  it('rejects invalid or unauthorized watch commands before subscribing', async () => {
    await expectFilesMemoryError(
      () => FilesMemory.live(null as never),
      'FilesMemoryError.InvalidPath',
    );

    const denied = FilesMemory.live({ files: { 'docs/readme.md': 'hello\n' } });
    await expectFilesMemoryError(
      () => cmd.watch(denied, { path: 'docs' }),
      'FilesMemoryError.PolicyDenied',
    );
    expect(denied.diagnostics.Active.watchCount()).to.eql(0);

    const backing = FilesMemory.live({
      files: { 'docs/readme.md': 'hello\n' },
      policy: Files.Policy.readonly('**'),
    });
    await expectFilesMemoryError(
      () => cmd.watch(backing, { path: 'missing' }),
      'FilesMemoryError.NotFound',
    );
    await expectFilesMemoryError(
      () => cmd.watch(backing, { path: 'docs/readme.md' }),
      'FilesMemoryError.NotDirectory',
    );
    await expectFilesMemoryError(
      () => cmd.watch(backing, { match: [123] as never }),
      'FilesMemoryError.InvalidPath',
    );
    expect(backing.diagnostics.Active.watchCount()).to.eql(0);
  });
});

function watchContext(events: t.Files.Change[]) {
  const controller = new AbortController();
  const context: t.Cmd.Handler.Context<
    t.FilesCmd.Name,
    t.FilesCmd.Event,
    t.FilesCmd.Name.Watch
  > = {
    id: 'req-files-memory-live-test' as t.Cmd.ReqId,
    name: Files.Cmd.Name.watch,
    ns: Files.Cmd.ns,
    signal: controller.signal,
    emit(event) {
      events.push(event);
    },
  };
  return {
    context,
    stop() {
      controller.abort('test.stop');
    },
  };
}
