import { Files } from '@sys/model/files';
import type { FilesPolicy } from '@sys/model/files/t';
import { FilesMemory } from '@sys/model/files/memory';
import { describe, expect, it, type t } from '../../-test.ts';
import { FilesServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

const LIVE_POLICY = {
  list: '**',
  stat: '**',
  read: '**',
  write: '**',
  remove: '**',
  watch: '**',
  manifest: true,
} satisfies FilesPolicy.Shape;

describe('FilesServer.WebSocket.create: live memory watch', () => {
  it('streams memory files watch events over websocket while Cmd read remains truth', async () => {
    const backing = FilesMemory.live({ dirs: ['docs'], policy: LIVE_POLICY });
    const server = FilesServer.WebSocket.create({ path: '/files', files: backing });
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

      const event = await waitForChange(events, { path, seq: expectedChange.seq });
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
      await remote.close();
      await server.close('test.cleanup');
    }
  });
});

type ChangeMatch = {
  readonly path: t.Files.String.Path;
  readonly seq?: t.Files.Seq;
};

async function waitForChange(
  events: readonly t.Files.Change[],
  match: ChangeMatch,
): Promise<t.Files.Change> {
  let found: t.Files.Change | undefined;
  await Fixture.waitFor(
    () => {
      found = events.find((event) => {
        if (event.path !== match.path) return false;
        if (match.seq !== undefined && event.seq !== match.seq) return false;
        return true;
      });
      return found !== undefined;
    },
    { message: `Timed out waiting for websocket Files.Change: ${match.path}.` },
  );
  return found!;
}
