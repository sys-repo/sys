import { Fs } from '@sys/fs';
import { Files } from '@sys/model/files/fs';
import { FilesMemory } from '@sys/model/files/memory';
import { describe, expect, Is, it, type t } from '../../-test.ts';
import { Fixture } from './u.fixture.ts';

const MEMORY_LIVE_POLICY = {
  list: '**',
  stat: '**',
  read: '**',
  write: '**',
  remove: '**',
  watch: '**',
  manifest: true,
} satisfies t.Files.Policy.Shape;

const REAL_FS_LIVE_POLICY = Files.Policy.readonly('docs/**', { watch: 'docs/**' });

const REAL_FS_WRITABLE_LIVE_POLICY = {
  list: 'docs/**',
  stat: 'docs/**',
  read: 'docs/**',
  write: 'docs/**',
  remove: 'docs/**',
  watch: 'docs/**',
  manifest: true,
} satisfies t.Files.Policy.Shape;

describe('FilesServer.WebSocket.create: live files watch', () => {
  it('streams memory files watch events over websocket while Cmd read remains truth', async () => {
    const backing = FilesMemory.Writable.live({ dirs: ['docs'], policy: MEMORY_LIVE_POLICY });

    await Fixture.withFilesServer(backing, async (server) => {
      await Fixture.withWatchedRemote(server, async ({ remote, events, closeWatch }) => {
        await Fixture.waitFor(
          () => backing.diagnostics.Active.watchCount() === 1,
          { message: 'Timed out waiting for websocket memory watch to become active.' },
        );

        const path = 'docs/live.md' as t.Files.String.Path;
        const entry = { path, kind: 'file', size: 5, mediaType: 'text/markdown' } as const;
        const expectedChange = { kind: 'created', path, seq: 1 as t.Files.Seq, entry } as const;

        const created = await remote.client.cmd.send(Files.Cmd.Name.write, {
          kind: 'text',
          path,
          content: 'live\n',
          mediaType: 'text/markdown',
        });
        expect(created).to.include({ kind: expectedChange.kind, path, seq: expectedChange.seq });
        expect(created.entry).to.eql(entry);
        expect(Is.str(created.correlation)).to.eql(true);

        const event = await Fixture.waitForChange(events, { path, seq: expectedChange.seq });
        expect(event).to.eql({
          ...expectedChange,
          origin: 'command',
          correlation: created.correlation,
        });

        const read = await remote.client.cmd.send(Files.Cmd.Name.read, { path });
        expect(read).to.eql({
          kind: 'inline',
          file: entry,
          encoding: 'utf8',
          content: 'live\n',
        });

        await closeWatch();
        await Fixture.waitFor(
          () => backing.diagnostics.Active.watchCount() === 0,
          { message: 'Timed out waiting for websocket memory watch to stop.' },
        );
      });
    });
  });

  it('streams real filesystem watch events over websocket while Cmd read remains truth', async () => {
    await Fixture.withWorkspace('sys-server-files-live-', async ({ workspace, root }) => {
      const backing = Files.Fs.Readonly.live({
        fs: Fs.Capability.Files.Readonly.live(Fs),
        root,
        policy: REAL_FS_LIVE_POLICY,
      });

      await Fixture.withFilesServer(backing, async (server) => {
        await Fixture.withWatchedRemote(server, async ({ remote, events, closeWatch }) => {
          expect(Fixture.detail(server.status(), 'files.kind')).to.eql('files/fs:live');
          expect(Fixture.detail(server.status(), 'files.fidelity')).to.eql(undefined);

          await Fixture.waitFor(
            () => backing.diagnostics.Active.watchCount() === 1,
            { message: 'Timed out waiting for websocket real fs watch to become active.' },
          );

          const path = 'docs/real.md' as t.Files.String.Path;
          const write = await Fs.write(Fs.join(root, 'docs', 'real.md'), 'real\n');
          expect(write.error).to.eql(undefined);

          const event = await Fixture.waitForChange(events, {
            path,
            kind: ['created', 'modified'] as const,
          });
          expect(event.path).to.eql(path);
          expect(Fs.Path.Is.absolute(event.path)).to.eql(false);
          expect(event.path).not.to.contain(root);
          expect(event.path).not.to.contain(workspace);
          if (event.entry) {
            expect(event.entry.path).to.eql(path);
            expect(event.entry.kind).to.eql('file');
            expect(Fs.Path.Is.absolute(event.entry.path)).to.eql(false);
          }

          const read = await remote.client.cmd.send(Files.Cmd.Name.read, { path });
          expect(read).to.eql({
            kind: 'inline',
            file: { path, kind: 'file', size: 5 },
            encoding: 'utf8',
            content: 'real\n',
          });

          await closeWatch();
          await Fixture.waitFor(
            () => backing.diagnostics.Active.watchCount() === 0,
            { message: 'Timed out waiting for websocket real fs watch to stop.' },
          );
        });
      });
    });
  });

  it('writes and removes durable real filesystem entries over websocket', async () => {
    await Fixture.withWorkspace('sys-server-files-write-', async ({ root }) => {
      const backing = Files.Fs.Writable.live({
        fs: Fs.Capability.Files.Writable.live(Fs),
        root,
        policy: REAL_FS_WRITABLE_LIVE_POLICY,
      });

      await Fixture.withFilesServer(backing, async (server) => {
        await Fixture.withWatchedRemote(server, async ({ remote, events, closeWatch }) => {
          expect(Fixture.detail(server.status(), 'files.kind')).to.eql('files/fs:writable-live');
          expect(Fixture.detail(server.status(), 'files.fidelity')).to.eql(undefined);
          expect(Fixture.detail(server.status(), 'files.capabilities')).to.eql(
            'list, stat, read, write, remove, watch, manifest',
          );

          await Fixture.waitFor(
            () => backing.diagnostics.Active.watchCount() === 1,
            { message: 'Timed out waiting for websocket writable real fs watch to become active.' },
          );

          const path = 'docs/ws-real.md' as t.Files.String.Path;
          const entry = { path, kind: 'file', size: 5 } as const;
          const created = await remote.client.cmd.send(Files.Cmd.Name.write, {
            kind: 'text',
            path,
            content: 'real\n',
            mediaType: 'text/markdown',
          });

          expect(created).to.include({ kind: 'created', path });
          expect(Is.number(created.seq)).to.eql(true);
          expect(created.entry).to.eql(entry);
          expect(Is.str(created.correlation)).to.eql(true);

          const createdEvent = await Fixture.waitForChange(events, { path, seq: created.seq });
          expect(createdEvent).to.eql({
            kind: 'created',
            path,
            entry,
            seq: created.seq,
            origin: 'command',
            correlation: created.correlation,
          });

          const hostPath = Fs.join(root, path);
          const hostStat = await Fs.stat(hostPath);
          expect(hostStat?.isFile).to.eql(true);
          expect(hostStat?.size).to.eql(5);
          const hostList = await Fs.ls(Fs.join(root, 'docs'));
          expect(hostList).to.eql([hostPath]);
          const hostRead = await Fs.readText(hostPath);
          expect(hostRead.ok).to.eql(true);
          expect(hostRead.data).to.eql('real\n');

          const cmdStat = await remote.client.cmd.send(Files.Cmd.Name.stat, { path });
          expect(cmdStat).to.eql({ entry });
          const cmdList = await remote.client.cmd.send(Files.Cmd.Name.list, { path: 'docs' });
          expect(cmdList.entries).to.eql([entry]);
          const cmdRead = await remote.client.cmd.send(Files.Cmd.Name.read, { path });
          expect(cmdRead).to.eql({
            kind: 'inline',
            file: entry,
            encoding: 'utf8',
            content: 'real\n',
          });

          const removed = await remote.client.cmd.send(Files.Cmd.Name.remove, { path });
          expect(removed).to.include({ kind: 'deleted', path });
          expect(Is.number(removed.seq)).to.eql(true);
          expect(Is.str(removed.correlation)).to.eql(true);

          const removedEvent = await Fixture.waitForChange(events, { path, seq: removed.seq });
          expect(removedEvent).to.eql({
            kind: 'deleted',
            path,
            seq: removed.seq,
            origin: 'command',
            correlation: removed.correlation,
          });

          const hostAfterStat = await Fs.stat(hostPath);
          expect(hostAfterStat).to.eql(undefined);
          const hostAfterList = await Fs.ls(Fs.join(root, 'docs'));
          expect(hostAfterList).to.eql([]);
          const hostAfterRemove = await Fs.readText(hostPath);
          expect(hostAfterRemove.exists).to.eql(false);

          const cmdListAfterRemove = await remote.client.cmd.send(Files.Cmd.Name.list, {
            path: 'docs',
          });
          expect(cmdListAfterRemove.entries).to.eql([]);
          const deniedStat = await remote.client.cmd
            .send(Files.Cmd.Name.stat, { path })
            .catch((error: unknown) => error);
          Fixture.expectCmdError(deniedStat, 'CmdError.Remote', Files.Cmd.Name.stat);
          const deniedRead = await remote.client.cmd
            .send(Files.Cmd.Name.read, { path })
            .catch((error: unknown) => error);
          Fixture.expectCmdError(deniedRead, 'CmdError.Remote', Files.Cmd.Name.read);

          await Fixture.waitFor(() => events.length >= 2, {
            message: 'Timed out waiting for durable real fs command-origin events.',
          });
          expect(events.every((event) => event.origin === 'command' || event.origin === 'fs-watch'))
            .to.eql(true);
          expect(events.some((event) => event.path.includes('.sys-files-atomic-'))).to.eql(false);

          await closeWatch();
          await Fixture.waitFor(
            () => backing.diagnostics.Active.watchCount() === 0,
            { message: 'Timed out waiting for websocket writable real fs watch to stop.' },
          );
        });
      });
    });
  });
});
