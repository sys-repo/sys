import { describe, expect, it, Time } from '../../src/-test.ts';
import { D, Files, Fs, HttpCmd, Process, type t } from './common.ts';

type Client = t.HttpCmd.Client<t.Files.Cmd.Name, t.Files.Cmd.Payload, t.Files.Cmd.Result>;

describe('sample:files:http:cmd', () => {
  it('starts the sample server and serves dist-backed Files metadata over unary HTTP Cmd', async () => {
    const root = Fs.Path.fromFileUrl(new URL('../..', import.meta.url));
    const process = Process.spawn({
      args: ['run', '-P=sample-files-http-cmd', './-sample/files.http.cmd/-start.ts'],
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
      await assertGetHelp();
      await assertManifestGet(client);
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

async function assertGetHelp() {
  const res = await fetch(D.url);
  expect(res.status).to.eql(200);
  expect(res.headers.get('content-type')).to.contain('text/plain');

  const text = await res.text();
  expect(text).to.contain('👋 Files<T>');
  expect(text).to.contain('GET /files/manifest');
  expect(text).to.contain('POST /files');
  expect(text).to.contain('runtime dist.json');
  expect(text).to.contain('content refs');
  expect(text).to.contain('curl -s');
  expect(text).to.contain('"id":"req-curl"');
  expect(text).to.contain('"name":"files:read"');
}

async function assertManifestGet(client: Client) {
  const res = await fetch(`${D.url}/manifest`);
  expect(res.status).to.eql(200);
  expect(res.headers.get('content-type')).to.contain('application/json');
  expect(await res.json()).to.eql(await client.send(Files.Cmd.Name.manifest, {}));
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
    fidelity: 'snapshot',
  });
}

async function assertDocsCorpus(client: Client) {
  const manifest = await client.send(Files.Cmd.Name.manifest, {});
  expect(manifest.version).to.eql('sys.files.manifest:v1');
  expect(manifest.entries.map((entry) => entry.path).sort()).to.eql([
    'README.md',
    'hello.json',
    'hello.txt',
  ]);

  const hello = manifest.entries.find((entry) => entry.path === 'hello.txt');
  if (!hello || hello.kind !== 'file') throw new Error('Expected hello.txt file entry.');
  expect(hello.size).to.eql(41);
  expect(typeof hello.hash).to.eql('string');
  expect(hello.hash?.startsWith('sha256-')).to.eql(true);

  const listed = await client.send(Files.Cmd.Name.list, { path: '' });
  expect(listed.entries).to.eql(manifest.entries);

  const stat = await client.send(Files.Cmd.Name.stat, { path: 'hello.txt' });
  expect(stat.entry).to.eql(hello);

  const txt = await client.send(Files.Cmd.Name.read, { path: 'hello.txt' });
  expect(txt.kind).to.eql('ref');
  if (txt.kind !== 'ref') throw new Error('Expected static dist read ref result.');
  expect(txt.file).to.eql(hello);
  expect(txt.contentRef).to.eql({
    kind: 'hash',
    path: 'hello.txt',
    size: 41,
    hash: hello.hash,
  });
}
