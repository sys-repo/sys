import { Cmd, describe, expect, it, Net, Time, type t } from '../../../src/-test.ts';
import { D, Files, Fs, Process } from '../common.ts';

describe('sample:files:ws', () => {
  it('starts the sample server and serves the docs corpus over websocket', async () => {
    const root = Fs.Path.fromFileUrl(new URL('../../..', import.meta.url));
    const process = Process.spawn({
      args: ['run', '-P=sample-files-ws', './-sample/files.websocket/-start.ts'],
      cwd: root,
      silent: true,
    });

    let ws: WebSocket | undefined;
    let client: t.FilesCmd.Client | undefined;

    try {
      await Time.waitFor(async () => {
        const next = new WebSocket(D.url);
        try {
          await Net.waitFor(next);
          ws = next;
          return true;
        } catch {
          if (next.readyState < WebSocket.CLOSING) next.close();
          return false;
        }
      }, { interval: 20, timeout: 5_000 });

      client = Cmd.make<
        t.FilesCmd.Name,
        t.FilesCmd.Payload,
        t.FilesCmd.Result,
        t.FilesCmd.Event
      >({ ns: Files.Cmd.ns }).client(Cmd.Transport.fromWebSocket(ws!), { timeout: 1_000 });

      const txt = await client.send(Files.Cmd.Name.read, { path: 'hello.txt' });
      const yaml = await client.send(Files.Cmd.Name.read, { path: 'hello.yaml' });
      const json = await client.send(Files.Cmd.Name.read, { path: 'hello.json' });

      expect(txt.kind).to.eql('inline');
      expect(yaml.kind).to.eql('inline');
      expect(json.kind).to.eql('inline');
      if (txt.kind === 'inline') expect(txt.content).to.contain('hello from @sys/server');
      if (yaml.kind === 'inline') expect(yaml.content).to.contain('hello from @sys/server');
      if (json.kind === 'inline') expect(json.content).to.contain('"kind": "sample"');
    } finally {
      client?.dispose();
      if (ws && ws.readyState < WebSocket.CLOSING) ws.close();
      await process.dispose();
    }
  });
});
