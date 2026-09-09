import { describe, expect, expectError, Fs, it, type t, Yaml } from '../../../-test.ts';
import { HttpProxy } from '../mod.ts';

const CONFIG = 'app';
const CONFIG_PATH = '-config/@sys.http/proxy/app.yaml';
const INPUT = {
  config: CONFIG,
  mount: '/payments/',
  upstream: 'http://127.0.0.1:4040/payments/',
} as const;

describe('HttpProxy.Mount.add', () => {
  it('creates a missing config before adding a mount', async () => {
    const cwd = await tempRoot();

    const res = await HttpProxy.Mount.add({ cwd, ...INPUT });
    const doc = await readConfig(cwd);

    expect(res.kind).to.eql('added');
    expect(res.created).to.eql(true);
    expect(doc).to.eql({
      name: 'app',
      hostname: '127.0.0.1',
      port: 4040,
      mounts: [{ path: '/payments/', target: 'http://127.0.0.1:4040/payments/' }],
    });
  });

  it('appends a new mount to an existing config while preserving root', async () => {
    const cwd = await tempRoot();
    await writeConfig(
      cwd,
      'name: app\nhostname: 127.0.0.1\nport: 4040\nroot:\n  target: http://127.0.0.1:4040/\nmounts:\n  - path: /api/\n    target: http://127.0.0.1:4040/api/\n',
    );

    const res = await HttpProxy.Mount.add({ cwd, ...INPUT });
    const doc = await readConfig(cwd);

    expect(res.kind).to.eql('added');
    expect(res.created).to.eql(false);
    expect(doc.root).to.eql({ target: 'http://127.0.0.1:4040/' });
    expect(doc.mounts).to.eql([
      { path: '/api/', target: 'http://127.0.0.1:4040/api/' },
      { path: '/payments/', target: 'http://127.0.0.1:4040/payments/' },
    ]);
  });

  it('updates an existing mount path with a different upstream', async () => {
    const cwd = await tempRoot();
    await writeConfig(
      cwd,
      'name: app\nhostname: 127.0.0.1\nport: 4040\nmounts:\n  - path: /payments/\n    target: http://127.0.0.1:4040/old/\n',
    );

    const res = await HttpProxy.Mount.add({ cwd, ...INPUT });
    const doc = await readConfig(cwd);

    expect(res.kind).to.eql('updated');
    expect(doc.mounts).to.eql([
      { path: '/payments/', target: 'http://127.0.0.1:4040/payments/' },
    ]);
  });

  it('treats an identical mount as a no-op success', async () => {
    const cwd = await tempRoot();
    await writeConfig(
      cwd,
      'name: app\nhostname: 127.0.0.1\nport: 4040\nmounts:\n  - path: /payments/\n    target: http://127.0.0.1:4040/payments/\n',
    );

    const res = await HttpProxy.Mount.add({ cwd, ...INPUT });

    expect(res.kind).to.eql('exists');
    expect(res.created).to.eql(false);
  });

  it('does not write on dry-run', async () => {
    const cwd = await tempRoot();

    const res = await HttpProxy.Mount.add({ cwd, ...INPUT, dryRun: true });

    expect(res.kind).to.eql('dry-run');
    expect(res.created).to.eql(true);
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('rejects invalid mount inputs before writing config', async () => {
    const cwd = await tempRoot();

    await expectError(
      () => HttpProxy.Mount.add({ cwd, ...INPUT, mount: '/' }),
      'HttpProxy mount add: invalid mount: / -> http://127.0.0.1:4040/payments/',
    );
    await expectError(
      () => HttpProxy.Mount.add({ cwd, ...INPUT, upstream: 'http://127.0.0.1:4040/payments' }),
      'HttpProxy mount add: invalid mount: /payments/ -> http://127.0.0.1:4040/payments',
    );
    await expectError(
      () => HttpProxy.Mount.add({ cwd, ...INPUT, upstream: 'http://127.0.0.1:4040/payments/?x=1' }),
      'HttpProxy mount add: invalid mount: /payments/ -> http://127.0.0.1:4040/payments/?x=1',
    );
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });
});

async function tempRoot() {
  return (await Fs.makeTempDir({ prefix: 'sys.http.proxy.mount.' })).absolute;
}

async function writeConfig(cwd: string, text: string) {
  await Fs.write(Fs.join(cwd, CONFIG_PATH), text, { force: true });
}

async function readConfig(cwd: string): Promise<t.HttpProxy.Config.Doc> {
  const read = await Fs.readText(Fs.join(cwd, CONFIG_PATH));
  if (!read.ok) throw new Error('failed to read test config');
  const parsed = Yaml.parse<t.HttpProxy.Config.Doc>(read.data ?? '');
  if (parsed.error || !parsed.data) throw new Error('failed to parse test config');
  return parsed.data;
}
