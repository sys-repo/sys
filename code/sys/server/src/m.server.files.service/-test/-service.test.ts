import { describe, expect, Files, Fs, it, Str, type t, Testing } from '../../-test.ts';
import { FilesWebSocketService } from '../mod.ts';

describe('FilesWebSocketService', () => {
  it('API: public export resolves to the Files websocket lifecycle endpoint', async () => {
    const mod = await import('@sys/server/files/service');
    expect(mod.FilesWebSocketService).to.equal(FilesWebSocketService);
    expect(mod.FilesWebSocketService.resources).to.equal(FilesWebSocketService.resources);
    expect(mod.FilesWebSocketService.start).to.equal(FilesWebSocketService.start);
    expect(Object.isFrozen(FilesWebSocketService)).to.eql(true);
  });

  it('declares configured websocket listener resources without starting services', async () => {
    const dir = await Testing.dir('FilesWebSocketService.resources');
    const config = Fs.join(dir.dir, '-config/files.yaml');
    await Fs.write(
      config,
      Str.dedent(`
        name: shell:files
        root: .
        path: /files
        port: 5050
      `).trimStart(),
    );

    const resources = await FilesWebSocketService.resources({
      cwd: dir.dir as t.StringDir,
      paths: { config },
    });

    expect(resources).to.eql([{ kind: 'tcp-listener', host: '127.0.0.1', port: 5050 }]);
  });

  it('omits websocket resources for ephemeral configured ports', async () => {
    const dir = await Testing.dir('FilesWebSocketService.resources.ephemeral');
    const config = Fs.join(dir.dir, '-config/files.yaml');
    await Fs.write(
      config,
      Str.dedent(`
        root: .
        path: /files
        port: 0
      `).trimStart(),
    );

    const resources = await FilesWebSocketService.resources({
      cwd: dir.dir as t.StringDir,
      paths: { config },
    });

    expect(resources).to.eql([]);
  });

  it('reports the resolved listen address when the service port is already in use', async () => {
    const blocker = Deno.listen({ hostname: '127.0.0.1', port: 0 });
    const addr = blocker.addr as Deno.NetAddr;
    const dir = await Testing.dir('FilesWebSocketService.port-in-use');
    const config = Fs.join(dir.dir, '-config/files.yaml');
    await Fs.write(
      config,
      Str.dedent(`
        name: shell:files
        root: .
        path: /files
        port: ${addr.port}
      `).trimStart(),
    );

    try {
      const error = await catchStart(() => {
        return FilesWebSocketService.start({
          cwd: dir.dir as t.StringDir,
          paths: { config },
          silent: true,
        });
      });

      expect(error?.message).to.eql(
        `WebSocketServer.create: address already in use: 127.0.0.1:${addr.port}.`,
      );
    } finally {
      blocker.close();
    }
  });

  it('starts from config and serves a bounded Files root over websocket', async () => {
    const dir = await Testing.dir('FilesWebSocketService.start');
    await Fs.write(Fs.join(dir.dir, 'app/shell.yaml'), 'kind: shell.structure\nversion: 1\n');
    const config = Fs.join(dir.dir, '-config/files.yaml');
    await Fs.write(
      config,
      'name: shell:files\nroot: ./app\npath: /draft/files\nport: 0\nwatch: true\npolicy: "**"\n',
    );

    const server = await FilesWebSocketService.start({
      cwd: dir.dir as t.StringDir,
      paths: { config },
      silent: true,
    });
    const client = await Files.Client.websocket(server.url);

    try {
      const status = server.status();
      expect(status.name).to.eql('shell:files');
      expect(status.kind).to.eql('files:websocket');
      expect(status.root).to.eql(Fs.join(dir.dir, 'app'));
      expect(status.config).to.eql(config);
      expect(status.urls).to.eql([
        { href: server.url, label: 'files:websocket' },
        { href: `${server.origin}/draft/files/manifest`, label: 'files:manifest' },
      ]);

      const manifest = await fetch(`${server.origin}/draft/files/manifest`);
      expect(manifest.status).to.eql(200);
      const json = await manifest.json();
      expect(json.entries.map((e: t.Files.Entry) => e.path)).to.eql(['shell.yaml']);

      const read = await client.cmd.send(Files.Cmd.Name.read, { path: 'shell.yaml' });
      expect(read.kind).to.eql('inline');
      if (read.kind === 'inline') expect(read.content).to.contain('kind: shell.structure');
    } finally {
      await client.close('test.cleanup');
      await server.close('test.cleanup');
    }
  });
});

/**
 * Helpers:
 */
async function catchStart(fn: () => unknown | Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (cause) {
    return cause as Error;
  }
}
