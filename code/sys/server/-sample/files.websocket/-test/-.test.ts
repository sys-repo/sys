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

      const txt = await client.readText('hello.txt');
      const yaml = await client.readText('hello.yaml');
      const json = await client.readText('hello.json');

      expect(txt).to.contain('hello from @sys/server');
      expect(yaml).to.contain('hello from @sys/server');
      expect(json).to.contain('"kind": "sample"');
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
