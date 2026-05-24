import { Files } from '@sys/model/files';
import { FilesMemory } from '@sys/model/files/memory';
import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { FilesServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('FilesServer.WebSocket.create', () => {
  it('serves a bounded Files backing over websocket without widening authority', async () => {
    const backing = FilesMemory.Readonly.create({
      files: {
        'foo.json': { content: '{ "foo": true }\n', mediaType: 'application/json' },
        'notes/baz.md': { content: '# Baz\n', mediaType: 'text/markdown' },
        'secret.txt': 'nope\n',
      },
      policy: Files.Policy.readonly('**', { deny: 'secret.txt', maxReadBytes: 64 }),
    });
    const server = FilesServer.WebSocket.create({
      path: '/files',
      files: backing,
      status: { name: 'Fixture Files' },
    });
    const remote = await Fixture.connect(server.url);

    try {
      expectTypeOf(server).toMatchTypeOf<t.WebSocketServer.Started>();

      const status = server.status();
      expect(status.name).to.eql('Fixture Files');
      expect(status.kind).to.eql('files:websocket');
      expect(status.urls).to.eql([{ href: server.url, label: 'files:websocket' }]);
      expect(Fixture.detail(status, 'namespace')).to.eql(Files.Cmd.ns);
      expect(Fixture.detail(status, 'files.kind')).to.eql('files/memory:readonly');
      expect(Fixture.detail(status, 'files.fidelity')).to.eql(undefined);
      expect(Fixture.detail(status, 'files.capabilities')).to.eql('list,stat,read,manifest');

      const capabilities = await remote.client.cmd.send(Files.Cmd.Name.capabilities, {});
      expect(capabilities).to.eql(
        await Fixture.direct(backing, Files.Cmd.Name.capabilities, {}),
      );

      const listPayload = { depth: 2 } satisfies t.Files.Cmd.List.Payload;
      const list = await remote.client.cmd.send(Files.Cmd.Name.list, listPayload);
      expect(list).to.eql(await Fixture.direct(backing, Files.Cmd.Name.list, listPayload));
      expect(list.entries.map((entry) => entry.path)).to.eql([
        'foo.json',
        'notes',
        'notes/baz.md',
      ]);

      const readPayload = { path: 'foo.json' } satisfies t.Files.Cmd.Read.Payload;
      const read = await remote.client.cmd.send(Files.Cmd.Name.read, readPayload);
      expect(read).to.eql(await Fixture.direct(backing, Files.Cmd.Name.read, readPayload));
      expect(read).to.eql({
        kind: 'inline',
        file: { path: 'foo.json', kind: 'file', size: 16, mediaType: 'application/json' },
        encoding: 'utf8',
        content: '{ "foo": true }\n',
      });

      const denied = await remote.client.cmd
        .send(Files.Cmd.Name.read, { path: 'secret.txt' })
        .catch((error: unknown) => error);
      const error = Fixture.expectCmdError(denied, 'CmdError.Remote', Files.Cmd.Name.read);
      expect(error.message).to.eql('Read denied: secret.txt');
      expect(error.message).not.to.contain('FilesMemoryError');
    } finally {
      await remote.close();
      await server.close('test.cleanup');
    }
  });
});
