import { describe, expect, it, Time } from '../../src/-test.ts';
import { Cli, D, Files, Fs, Process, type t } from './common.ts';

describe('sample:files:ws', () => {
  it('starts the sample server and serves the docs corpus over websocket', async () => {
    const root = Fs.Path.fromFileUrl(new URL('../..', import.meta.url));
    let stdout = '';
    let url: string | undefined;
    const process = Process.spawn({
      args: ['run', '-P=sample-files-tty', './-sample/files.ws/-start.ts'],
      cwd: root,
      env: { [D.env.port]: '0' },
      readySignal(event) {
        if (event.source !== 'stdout') return false;
        stdout += event.toString();
        const endpoint = /ws:\/\/(?:localhost|127\.0\.0\.1):[1-9]\d*\/files(?=\s)/;
        url = Cli.stripAnsi(stdout).match(endpoint)?.[0];
        return url !== undefined;
      },
      silent: true,
    });

    let client: t.Files.Client.WebSocket | undefined;

    try {
      await waitForReady(process);
      if (!url) throw new Error('Expected the sample server to report its bound WebSocket URL.');
      client = await Files.Client.websocket(url, { timeout: 1_000 });

      const txt = await client.readText('hello.txt');
      const yaml = await client.readText('hello.yaml');
      const json = await client.readText('hello.json');

      expect(txt).to.contain('hello from @sys/server');
      expect(yaml).to.contain('hello from @sys/server');
      expect(json).to.contain('"kind": "sample"');

      const manifest = await client.cmd.send(Files.Cmd.Name.manifest, {});
      const hello = manifest.entries.find((entry) => entry.path === 'hello.txt');
      if (!hello || hello.kind !== 'file') throw new Error('Expected hello.txt file entry.');
      expect(hello.size).to.be.greaterThan(0);
      expect(hello.hash).to.eql(undefined);
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
