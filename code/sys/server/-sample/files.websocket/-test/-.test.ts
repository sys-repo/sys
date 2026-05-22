import { describe, expect, it, Time } from '../../../src/-test.ts';
import { D, Files, Fs, Process, type t } from '../common.ts';

describe('sample:files:ws', () => {
  it('starts the sample server and serves the docs corpus over websocket', async () => {
    const root = Fs.Path.fromFileUrl(new URL('../../..', import.meta.url));
    const process = Process.spawn({
      args: ['run', '-P=sample-files-ws', './-sample/files.websocket/-start.ts'],
      cwd: root,
      silent: true,
    });

    let client: t.Files.Client.WebSocket | undefined;

    try {
      await Time.waitFor(async () => {
        try {
          client = await Files.Client.websocket(D.url, { timeout: 1_000 });
          return true;
        } catch {
          return false;
        }
      }, { interval: 20, timeout: 5_000 });
      if (client === undefined) throw new Error('Timed out connecting Files websocket client.');

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
      await client?.close('test.cleanup');
      await process.dispose();
    }
  });
});
