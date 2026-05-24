import { describe, expect, it, Time } from '../../../src/-test.ts';
import { D, Files, Fs, Process, type t } from '../common.ts';

describe('sample:files:ws', () => {
  it('starts the sample server and serves the docs corpus over websocket', async () => {
    const root = Fs.Path.fromFileUrl(new URL('../../..', import.meta.url));
    const process = Process.spawn({
      args: ['run', '-P=sample-files-ws', './-sample/files.websocket/-start.ts'],
      cwd: root,
      readySignal: (event) => event.toString().includes(D.path),
      silent: true,
    });

    let client: t.Files.Client.WebSocket | undefined;

    try {
      await waitForReady(process);
      client = await Files.Client.websocket(D.url, { timeout: 1_000 });

      const txt = await client.cmd.send(Files.Cmd.Name.read, { path: 'hello.txt' });
      const yaml = await client.cmd.send(Files.Cmd.Name.read, { path: 'hello.yaml' });
      const json = await client.cmd.send(Files.Cmd.Name.read, { path: 'hello.json' });

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

/**
 * Helpers:
 */
async function waitForReady(process: ReturnType<typeof Process.spawn>): Promise<void> {
  const timeout = Time.wait(5_000);

  try {
    await Promise.race([
      process.whenReady(),
      timeout.then(() => Promise.reject(new Error('Timed out waiting for sample Files server.'))),
    ]);
  } finally {
    timeout.cancel();
  }
}
