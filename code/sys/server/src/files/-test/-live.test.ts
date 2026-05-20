import { Fs } from '@sys/fs';
import { Files } from '@sys/model/files';
import type { FilesPolicy } from '@sys/model/files/t';
import { FilesFs } from '@sys/model/files/fs';
import { FilesMemory } from '@sys/model/files/memory';
import { describe, expect, it, type t } from '../../-test.ts';
import { FilesServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

const MEMORY_LIVE_POLICY = {
  list: '**',
  stat: '**',
  read: '**',
  write: '**',
  remove: '**',
  watch: '**',
  manifest: true,
} satisfies FilesPolicy.Shape;

const REAL_FS_LIVE_POLICY = Files.Policy.readonly('docs/**', { watch: 'docs/**' });

describe('FilesServer.WebSocket.create: live files watch', () => {
  it('streams memory files watch events over websocket while Cmd read remains truth', async () => {
    const backing = FilesMemory.Writable.live({ dirs: ['docs'], policy: MEMORY_LIVE_POLICY });
    const server = FilesServer.WebSocket.create({ path: '/files', files: backing });

    try {
      const remote = await Fixture.connect(server.url, { timeout: false });
      const events: t.Files.Change[] = [];
      const stream = remote.client.stream(Files.Cmd.Name.watch, { path: 'docs' });
      const done = stream.done.catch((error: unknown) => error);
      const subscription = stream.onEvent((event) => events.push(event));

      try {
        await Fixture.waitFor(
          () => backing.diagnostics.Active.watchCount() === 1,
          { message: 'Timed out waiting for websocket memory watch to become active.' },
        );

        const path = 'docs/live.md' as t.Files.String.Path;
        const entry = { path, kind: 'file', size: 5, mediaType: 'text/markdown' } as const;
        const expectedChange = { kind: 'created', path, seq: 1 as t.Files.Seq, entry } as const;

        const created = await remote.client.send(Files.Cmd.Name.write, {
          kind: 'text',
          path,
          content: 'live\n',
          mediaType: 'text/markdown',
        });
        expect(created).to.eql(expectedChange);

        const event = await Fixture.waitForChange(events, { path, seq: expectedChange.seq });
        expect(event).to.eql(expectedChange);

        const read = await remote.client.send(Files.Cmd.Name.read, { path });
        expect(read).to.eql({
          kind: 'inline',
          file: entry,
          encoding: 'utf8',
          content: 'live\n',
        });

        stream.dispose();
        const error = await done;
        Fixture.expectCmdError(error, 'CmdError.Cancelled', Files.Cmd.Name.watch);
        await Fixture.waitFor(
          () => backing.diagnostics.Active.watchCount() === 0,
          { message: 'Timed out waiting for websocket memory watch to stop.' },
        );
      } finally {
        subscription.dispose();
        stream.dispose();
        await done;
        await remote.close();
      }
    } finally {
      await server.close('test.cleanup');
    }
  });

  it('streams real filesystem watch events over websocket while Cmd read remains truth', async () => {
    const workspace = await Fs.makeTempDir({ prefix: 'sys-server-files-live-' });

    try {
      const root = Fs.join(workspace.absolute, 'root');
      await Fs.ensureDir(Fs.join(root, 'docs'));

      const backing = FilesFs.live({
        fs: Fs.Capability.Files.toLive(Fs),
        root,
        policy: REAL_FS_LIVE_POLICY,
      });
      const server = FilesServer.WebSocket.create({ path: '/files', files: backing });

      try {
        const remote = await Fixture.connect(server.url, { timeout: false });
        const events: t.Files.Change[] = [];
        const stream = remote.client.stream(Files.Cmd.Name.watch, { path: 'docs' });
        const done = stream.done.catch((error: unknown) => error);
        const subscription = stream.onEvent((event) => events.push(event));

        try {
          expect(Fixture.detail(server.status(), 'files.kind')).to.eql('files/fs:live');
          expect(Fixture.detail(server.status(), 'files.fidelity')).to.eql('live');

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
          expect(event.path).not.to.contain(workspace.absolute);
          if (event.entry) {
            expect(event.entry.path).to.eql(path);
            expect(event.entry.kind).to.eql('file');
            expect(Fs.Path.Is.absolute(event.entry.path)).to.eql(false);
          }

          const read = await remote.client.send(Files.Cmd.Name.read, { path });
          expect(read).to.eql({
            kind: 'inline',
            file: { path, kind: 'file', size: 5 },
            encoding: 'utf8',
            content: 'real\n',
          });

          stream.dispose();
          const error = await done;
          Fixture.expectCmdError(error, 'CmdError.Cancelled', Files.Cmd.Name.watch);
          await Fixture.waitFor(
            () => backing.diagnostics.Active.watchCount() === 0,
            { message: 'Timed out waiting for websocket real fs watch to stop.' },
          );
        } finally {
          subscription.dispose();
          stream.dispose();
          await done;
          await remote.close();
        }
      } finally {
        await server.close('test.cleanup');
      }
    } finally {
      await Fs.remove(workspace.absolute);
    }
  });
});
