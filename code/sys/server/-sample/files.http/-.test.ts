import { describe, expect, it, Time } from '../../src/-test.ts';
import { D, Files, Fs, HttpCmd, Process, type t } from './common.ts';

type Client = t.HttpCmd.Client<t.Files.Cmd.Name, t.Files.Cmd.Payload, t.Files.Cmd.Result>;

describe('sample:files:http', () => {
  it('starts the sample server and serves the docs corpus over unary HTTP Cmd', async () => {
    const root = Fs.Path.fromFileUrl(new URL('../..', import.meta.url));
    const process = Process.spawn({
      args: ['run', '-P=sample-files-http', './-sample/files.http/-start.ts'],
      cwd: root,
      readySignal: (event) => event.toString().includes(D.path),
      silent: true,
    });

    const client = HttpCmd.client<t.Files.Cmd.Name, t.Files.Cmd.Payload, t.Files.Cmd.Result>({
      url: D.url,
      ns: Files.Cmd.ns,
      timeout: 1_000,
    });

    try {
      await waitForReady(process);
      await assertCapabilities(client);
      await assertDocsCorpus(client);
    } finally {
      client.dispose();
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
      timeout.then(() =>
        Promise.reject(new Error('Timed out waiting for sample Files HTTP server.'))
      ),
    ]);
  } finally {
    timeout.cancel();
  }
}

async function assertCapabilities(client: Client) {
  const capabilities = await client.send(Files.Cmd.Name.capabilities, {});
  expect(capabilities).to.eql({
    list: true,
    stat: true,
    read: true,
    write: false,
    remove: false,
    watch: false,
    manifest: true,
    encodings: ['utf8'],
  });
}

async function assertDocsCorpus(client: Client) {
  const manifest = await client.send(Files.Cmd.Name.manifest, {});
  expect(manifest.version).to.eql('sys.files.manifest.v1');
  expect(manifest.entries.map((entry) => entry.path).sort()).to.eql([
    'README.md',
    'hello.json',
    'hello.txt',
  ]);

  const listed = await client.send(Files.Cmd.Name.list, { path: '' });
  expect(listed.entries.map((entry) => entry.path).sort()).to.eql([
    'README.md',
    'hello.json',
    'hello.txt',
  ]);

  const stat = await client.send(Files.Cmd.Name.stat, { path: 'hello.txt' });
  expect(stat.entry).to.eql({ path: 'hello.txt', kind: 'file', size: 41 });

  const txt = await client.send(Files.Cmd.Name.read, { path: 'hello.txt' });
  expect(txt.kind).to.eql('inline');
  if (txt.kind !== 'inline') throw new Error('Expected inline text result.');
  expect(txt.content).to.contain('hello from @sys/server HTTP Files sample');

  const json = await client.send(Files.Cmd.Name.read, { path: 'hello.json' });
  expect(json.kind).to.eql('inline');
  if (json.kind !== 'inline') throw new Error('Expected inline JSON result.');
  expect(json.content).to.contain('"transport": "http.cmd"');
}
