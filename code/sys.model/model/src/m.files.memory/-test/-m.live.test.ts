import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Files } from '../../m.files/mod.ts';
import { FilesMemory } from '../mod.ts';
import { allowAllMutablePolicy, cmd, expectFilesMemoryError } from './u.fixture.ts';

describe('FilesMemory.Writable.live', () => {
  describe('surface', () => {
    it('creates a bounded live backing with writable commands and watch diagnostics', async () => {
      const backing = FilesMemory.Writable.live({
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
        write: true,
        remove: true,
        watch: true,
        manifest: true,
        fidelity: 'live',
        maxReadBytes: 64,
        encodings: ['utf8'],
      });
    });
  });

  describe('write/remove projection', () => {
    it('projects writable write/remove results with only live sequence/correlation hints added', async () => {
      const options = {
        dirs: ['docs'],
        policy: allowAllMutablePolicy,
      } satisfies t.FilesMemory.Options;
      const writable = FilesMemory.Writable.create(options);
      const live = FilesMemory.Writable.live(options);
      const events: t.Files.Change[] = [];
      const watcher = watchContext(events);
      const done = live.handlers['files:watch']({ path: 'docs' }, watcher.context);

      await live.diagnostics.Active.whenActive();

      const createPayload = {
        kind: 'text',
        path: 'docs/readme.md',
        content: 'hello\n',
        mediaType: 'text/markdown',
      } satisfies t.Files.Cmd.Write.Payload;
      const writableCreated = await cmd.write(writable, createPayload);
      const liveCreated = await cmd.write(live, createPayload);
      expect(withoutLiveMeta(liveCreated)).to.eql(writableCreated);
      expect(events.at(-1)).to.eql({
        ...writableCreated,
        seq: liveCreated.seq,
        origin: 'command',
        correlation: liveCreated.correlation,
      });

      const modifyPayload = {
        kind: 'text',
        path: 'docs/readme.md',
        content: 'hello again\n',
      } satisfies t.Files.Cmd.Write.Payload;
      const writableModified = await cmd.write(writable, modifyPayload);
      const liveModified = await cmd.write(live, modifyPayload);
      expect(withoutLiveMeta(liveModified)).to.eql(writableModified);
      expect(events.at(-1)).to.eql({
        ...writableModified,
        seq: liveModified.seq,
        origin: 'command',
        correlation: liveModified.correlation,
      });

      const removePayload = { path: 'docs/readme.md' } satisfies t.Files.Cmd.Remove.Payload;
      const writableRemoved = await cmd.remove(writable, removePayload);
      const liveRemoved = await cmd.remove(live, removePayload);
      expect(withoutLiveMeta(liveRemoved)).to.eql(writableRemoved);
      expect(events.at(-1)).to.eql({
        ...writableRemoved,
        seq: liveRemoved.seq,
        origin: 'command',
        correlation: liveRemoved.correlation,
      });
      expect(events.map((event) => event.seq)).to.eql([1, 2, 3]);

      watcher.stop();
      await done;
    });

    it('emits created, modified, and deleted change hints while list/stat/read remain truth', async () => {
      const backing = FilesMemory.Writable.live({
        files: { 'docs/readme.md': 'hello\n' },
        policy: allowAllMutablePolicy,
      });
      const events: t.Files.Change[] = [];
      const { context, stop } = watchContext(events);
      const done = backing.handlers['files:watch']({ path: 'docs' }, context);

      await backing.diagnostics.Active.whenActive();

      await cmd.write(backing, {
        kind: 'text',
        path: 'docs/new.md',
        content: 'new\n',
        mediaType: 'text/markdown',
      });
      expect(events).to.eql([
        {
          kind: 'created',
          path: 'docs/new.md',
          seq: 1,
          origin: 'command',
          correlation: 'req-files-memory-test',
          entry: {
            path: 'docs/new.md',
            kind: 'file',
            size: 4,
            mediaType: 'text/markdown',
          },
        },
      ]);
      expect(await cmd.read(backing, { path: 'docs/new.md' })).to.eql({
        kind: 'inline',
        file: { path: 'docs/new.md', kind: 'file', size: 4, mediaType: 'text/markdown' },
        encoding: 'utf8',
        content: 'new\n',
      });

      await cmd.write(backing, { kind: 'text', path: 'docs/new.md', content: 'newer\n' });
      expect(events.at(-1)).to.eql({
        kind: 'modified',
        path: 'docs/new.md',
        seq: 2,
        origin: 'command',
        correlation: 'req-files-memory-test',
        entry: { path: 'docs/new.md', kind: 'file', size: 6 },
      });
      expect(await cmd.read(backing, { path: 'docs/new.md' })).to.eql({
        kind: 'inline',
        file: { path: 'docs/new.md', kind: 'file', size: 6 },
        encoding: 'utf8',
        content: 'newer\n',
      });

      await cmd.remove(backing, { path: 'docs/new.md' });
      expect(events.at(-1)).to.eql({
        kind: 'deleted',
        path: 'docs/new.md',
        seq: 3,
        origin: 'command',
        correlation: 'req-files-memory-test',
      });
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

    it('emits recursive delete hints for removed descendants deepest-first', async () => {
      const backing = FilesMemory.Writable.live({
        dirs: ['docs/tmp'],
        policy: allowAllMutablePolicy,
      });
      await cmd.write(backing, { kind: 'text', path: 'docs/tmp/a.txt', content: 'a' });
      await cmd.write(backing, { kind: 'text', path: 'docs/tmp/nested/b.txt', content: 'b' });

      const rootEvents: t.Files.Change[] = [];
      const childEvents: t.Files.Change[] = [];
      const root = watchContext(rootEvents);
      const child = watchContext(childEvents);
      const rootDone = backing.handlers['files:watch']({ path: 'docs/tmp' }, root.context);
      const childDone = backing.handlers['files:watch']({ path: 'docs/tmp/nested' }, child.context);

      await backing.diagnostics.Active.whenActive();
      expect(backing.diagnostics.Active.watchCount()).to.eql(2);

      const removed = await cmd.remove(backing, { path: 'docs/tmp', recursive: true });
      expect(removed).to.eql({
        kind: 'deleted',
        path: 'docs/tmp',
        seq: 6,
        correlation: 'req-files-memory-test',
      });
      expect(rootEvents.map((event) => event.path)).to.eql([
        'docs/tmp/nested/b.txt',
        'docs/tmp/nested',
        'docs/tmp/a.txt',
        'docs/tmp',
      ]);
      expect(rootEvents.map((event) => event.seq)).to.eql([3, 4, 5, 6]);
      expect(rootEvents.every((event) => event.kind === 'deleted')).to.eql(true);
      expect(childEvents.map((event) => event.path)).to.eql([
        'docs/tmp/nested/b.txt',
        'docs/tmp/nested',
      ]);
      expect(childEvents.map((event) => event.seq)).to.eql([3, 4]);

      root.stop();
      child.stop();
      await rootDone;
      await childDone;
    });
  });

  describe('watch filtering', () => {
    it('filters watch hints through policy, scope, match, and exclude', async () => {
      const policy = {
        list: '**',
        stat: '**',
        read: '**',
        write: '**',
        remove: '**',
        watch: 'docs/**',
        manifest: true,
      } satisfies t.Files.Policy.Shape;
      const backing = FilesMemory.Writable.live({
        files: { 'docs/readme.md': 'hello\n' },
        policy,
      });
      (policy as Record<string, unknown>).watch = 'other/**';
      const events: t.Files.Change[] = [];
      const { context, stop } = watchContext(events);
      const done = backing.handlers['files:watch'](
        { path: 'docs', match: '**/*.md', exclude: 'docs/draft.md' },
        context,
      );

      await backing.diagnostics.Active.whenActive();
      await cmd.write(backing, { kind: 'text', path: 'docs/readme.md', content: 'visible\n' });
      await cmd.write(backing, { kind: 'text', path: 'docs/draft.md', content: 'excluded\n' });
      await cmd.write(backing, {
        kind: 'text',
        path: 'other/readme.md',
        content: 'outside scope\n',
      });
      await cmd.write(backing, { kind: 'text', path: 'docs/data.json', content: '{}\n' });

      expect(events.map((event) => event.path)).to.eql(['docs/readme.md']);
      expect(events[0].kind).to.eql('modified');

      stop();
      await done;
    });

    it('omits event entry metadata when stat policy is not granted', async () => {
      const backing = FilesMemory.Writable.live({
        policy: { list: '**', read: '**', write: '**', watch: '**', manifest: true },
      });
      const events: t.Files.Change[] = [];
      const { context, stop } = watchContext(events);
      const done = backing.handlers['files:watch']({}, context);

      await backing.diagnostics.Active.whenActive();
      await cmd.write(backing, { kind: 'text', path: 'docs/readme.md', content: 'hello\n' });

      expect(events).to.eql([{
        kind: 'created',
        path: 'docs/readme.md',
        seq: 1,
        origin: 'command',
        correlation: 'req-files-memory-test',
      }]);

      stop();
      await done;
    });
  });

  describe('watch lifecycle', () => {
    it('keeps mutation truth when a watch subscriber rejects a hint', async () => {
      const backing = FilesMemory.Writable.live({ dirs: ['docs'], policy: allowAllMutablePolicy });
      const watcher = watchContext([]);
      const context = {
        ...watcher.context,
        emit() {
          throw new Error('subscriber failed');
        },
      };
      const done = backing.handlers['files:watch']({ path: 'docs' }, context);

      await backing.diagnostics.Active.whenActive();
      const result = await cmd.write(backing, {
        kind: 'text',
        path: 'docs/readme.md',
        content: 'ok',
      });
      expect(result).to.eql({
        kind: 'created',
        path: 'docs/readme.md',
        entry: { path: 'docs/readme.md', kind: 'file', size: 2 },
        seq: 1,
        correlation: 'req-files-memory-test',
      });
      expect(await cmd.read(backing, { path: 'docs/readme.md' })).to.eql({
        kind: 'inline',
        file: { path: 'docs/readme.md', kind: 'file', size: 2 },
        encoding: 'utf8',
        content: 'ok',
      });

      watcher.stop();
      await done;
    });

    it('supports multiple active watchers and per-stream cancellation', async () => {
      const backing = FilesMemory.Writable.live({
        dirs: ['docs'],
        policy: allowAllMutablePolicy,
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

      await cmd.write(backing, { kind: 'text', path: 'docs/readme.md', content: 'hello\n' });
      expect(docsEvents.map((event) => event.path)).to.eql(['docs/readme.md']);
      expect(markdownEvents.map((event) => event.path)).to.eql(['docs/readme.md']);

      docs.stop();
      await docsDone;
      expect(backing.diagnostics.Active.watchCount()).to.eql(1);

      await cmd.write(backing, { kind: 'text', path: 'docs/next.md', content: 'next\n' });
      expect(docsEvents.map((event) => event.path)).to.eql(['docs/readme.md']);
      expect(markdownEvents.map((event) => event.path)).to.eql(['docs/readme.md', 'docs/next.md']);

      markdown.stop();
      await markdownDone;
      expect(backing.diagnostics.Active.watchCount()).to.eql(0);
    });
  });

  describe('safety', () => {
    it('does not emit or consume sequence hints when live write/remove rejects', async () => {
      const backing = FilesMemory.Writable.live({
        files: { 'docs/keep.md': 'keep\n' },
        policy: {
          list: '**',
          stat: '**',
          read: '**',
          write: 'docs/tmp/**',
          remove: 'docs/tmp/**',
          watch: '**',
          manifest: true,
        },
      });
      const events: t.Files.Change[] = [];
      const watcher = watchContext(events);
      const done = backing.handlers['files:watch']({}, watcher.context);

      await backing.diagnostics.Active.whenActive();

      await expectFilesMemoryError(
        () => cmd.write(backing, { kind: 'text', path: 'docs/blocked.md', content: 'nope\n' }),
        'FilesMemoryError.PolicyDenied',
      );
      expect(events).to.eql([]);

      const created = await cmd.write(backing, {
        kind: 'text',
        path: 'docs/tmp/ok.md',
        content: 'ok\n',
      });
      expect(created.seq).to.eql(1);
      expect(events.map((event) => event.seq)).to.eql([1]);

      await expectFilesMemoryError(
        () => cmd.remove(backing, { path: 'docs/keep.md' }),
        'FilesMemoryError.PolicyDenied',
      );
      expect(events.map((event) => event.seq)).to.eql([1]);

      const removed = await cmd.remove(backing, { path: 'docs/tmp/ok.md' });
      expect(removed.seq).to.eql(2);
      expect(events.map(({ kind, path, seq }) => ({ kind, path, seq }))).to.eql([
        { kind: 'created', path: 'docs/tmp/ok.md', seq: 1 },
        { kind: 'deleted', path: 'docs/tmp/ok.md', seq: 2 },
      ]);

      watcher.stop();
      await done;
    });

    it('rejects invalid or unauthorized watch commands before subscribing', async () => {
      await expectFilesMemoryError(
        () => FilesMemory.Writable.live(null as never),
        'FilesMemoryError.InvalidPath',
      );

      const denied = FilesMemory.Writable.live({ files: { 'docs/readme.md': 'hello\n' } });
      await expectFilesMemoryError(
        () => cmd.watch(denied, { path: 'docs' }),
        'FilesMemoryError.PolicyDenied',
      );
      expect(denied.diagnostics.Active.watchCount()).to.eql(0);

      const backing = FilesMemory.Writable.live({
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
});

function withoutLiveMeta<R extends t.Files.Cmd.Write.Result | t.Files.Cmd.Remove.Result>(
  result: R,
): Omit<R, 'seq' | 'correlation'> {
  const { seq: _seq, correlation: _correlation, ...rest } = result;
  return rest;
}

function watchContext(events: t.Files.Change[]) {
  const controller = new AbortController();
  const context: t.Cmd.Handler.Context<
    t.Files.Cmd.Name,
    t.Files.Cmd.Event,
    t.Files.Cmd.Name.Watch
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
