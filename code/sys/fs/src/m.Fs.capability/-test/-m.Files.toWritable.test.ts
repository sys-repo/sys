import type { t as TModel } from '@sys/model';
import { Files } from '@sys/model/files/fs';
import { describe, expect, expectTypeOf, Is, it, Rx, type t } from '../../-test.ts';
import { Fs } from '../../mod.ts';
import { context, expectFilesFsError, setupFixture } from './u.fixture.ts';

const MUTABLE_POLICY = {
  list: '**',
  stat: '**',
  read: '**',
  write: '**',
  remove: '**',
  manifest: true,
} satisfies TModel.Files.Policy.Shape;

describe('Fs.Capability.Files.Writable', () => {
  it('adapts @sys/fs to the files/fs writable capability', async () => {
    const fixture = await setupFixture();
    try {
      const cap = Fs.Capability.Files.Writable.create(Fs);
      expectTypeOf(cap).toMatchTypeOf<TModel.FilesFs.Capability.Writable>();
      expect('watch' in cap).to.eql(false);

      const backing = Files.Fs.Writable.create({
        fs: cap,
        root: fixture.root,
        policy: MUTABLE_POLICY,
      });
      expect(backing.capabilities).to.include({
        write: true,
        remove: true,
        watch: false,
        fidelity: 'dynamic',
      });

      const path = 'docs/new.md' as TModel.Files.String.Path;
      const written = await backing.handlers['files:write'](
        { kind: 'text', path, content: 'new\n', mediaType: 'text/markdown' },
        context('files:write'),
      );
      expect(written).to.eql({ kind: 'created', path, entry: { path, kind: 'file', size: 4 } });

      const hostRead = await Fs.readText(Fs.join(fixture.root, path));
      expect(hostRead.ok).to.eql(true);
      expect(hostRead.data).to.eql('new\n');

      const listed = await backing.handlers['files:list']({ path: 'docs' }, context('files:list'));
      expect(listed.entries.some((entry) => entry.path.includes('.sys-files-atomic-'))).to.eql(
        false,
      );

      const removed = await backing.handlers['files:remove']({ path }, context('files:remove'));
      expect(removed).to.eql({ kind: 'deleted', path });
      const afterRemove = await Fs.readText(Fs.join(fixture.root, path));
      expect(afterRemove.exists).to.eql(false);
    } finally {
      await Fs.remove(fixture.workspace);
    }
  });

  it('does not widen Files authority through real symlink escapes', async () => {
    const fixture = await setupFixture();
    try {
      await Deno.symlink(fixture.outsideSecret, fixture.fileLink, { type: 'file' });

      const cap = Fs.Capability.Files.Writable.create(Fs);
      const backing = Files.Fs.Writable.create({
        fs: cap,
        root: fixture.root,
        policy: MUTABLE_POLICY,
      });

      await expectFilesFsError(
        () => {
          return backing.handlers['files:write'](
            { kind: 'text', path: 'docs/leak.txt', content: 'no\n' },
            context('files:write'),
          );
        },
        'FilesFsError.PathOutsideRoot',
        fixture,
      );
      await expectFilesFsError(
        () => backing.handlers['files:remove']({ path: 'docs/leak.txt' }, context('files:remove')),
        'FilesFsError.PathOutsideRoot',
        fixture,
      );

      const outside = await Fs.readText(fixture.outsideSecret);
      expect(outside.data).to.eql('secret\n');
    } finally {
      await Fs.remove(fixture.workspace);
    }
  });

  it('adapts @sys/fs to the files/fs live writable capability', () => {
    const cap = Fs.Capability.Files.Writable.live(Fs);
    expectTypeOf(cap).toMatchTypeOf<TModel.FilesFs.Capability.LiveWritable>();
    expect('watch' in cap).to.eql(true);
    expect('writeFileAtomic' in cap).to.eql(true);
    expect('removeEntry' in cap).to.eql(true);
  });

  it('filters live-writable atomic temp artifacts from backing watch events', async () => {
    const tempPath = Fs.join('/tmp/root', '.sys-files-atomic-test.tmp');
    const userPath = Fs.join('/tmp/root', 'docs/live.md');
    let sourceNext: ((event: t.Watch.Event) => void) | undefined;
    let sourceDisposed = false;
    const fs = {
      ...Fs,
      watch: async (path, options) => {
        const paths = Is.array<t.StringPath>(path) ? [...path] : [path];
        const life = Rx.lifecycle();
        const $$ = Rx.subject<t.Watch.Event>();
        const $ = $$.pipe(Rx.takeUntil(life.dispose$));
        sourceNext = (event) => $$.next(event);
        life.dispose$.subscribe(() => {
          sourceDisposed = true;
          sourceNext = undefined;
        });

        return Rx.toLifecycle<t.Watch.Instance>(life, {
          $,
          paths,
          exists: true,
          is: { recursive: options?.recursive },
        });
      },
    } satisfies t.Fs.Lib;

    const cap = Fs.Capability.Files.Writable.live(fs);
    const watcher = await cap.watch('/tmp/root', { recursive: true });
    const projected: TModel.FilesFs.Capability.WatchEvent[] = [];
    const subscription = watcher.$.subscribe((event) => projected.push(event));

    sourceNext?.({ kind: 'create', paths: [tempPath, userPath] });
    expect(projected).to.eql([{ kind: 'create', paths: [userPath] }]);

    sourceNext?.({ kind: 'modify', paths: [tempPath] });
    expect(projected).to.eql([{ kind: 'create', paths: [userPath] }]);

    subscription.unsubscribe();
    watcher.dispose();
    expect(sourceDisposed).to.eql(true);
  });
});
