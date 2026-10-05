import { describe, expect, expectError, Fs, it, type t, Yaml } from '../../../-test.ts';
import { HttpProxy } from '../mod.ts';

const CONFIG = 'app';
const CONFIG_PATH = '-config/@sys.http/proxy/app.yaml';
const INPUT = {
  config: CONFIG,
  hostname: '127.0.0.1',
  port: 4040,
} as const;

describe('HttpProxy.Config.add', () => {
  it('creates a missing reverse-proxy config with default lifecycle fields', async () => {
    const cwd = await tempRoot();

    const res = await HttpProxy.Config.add({ cwd, config: CONFIG });
    const doc = await readConfig(cwd);

    expect(res.kind).to.eql('added');
    expect(res.created).to.eql(true);
    expect(doc).to.eql({
      name: 'app',
      hostname: '127.0.0.1',
      port: 4040,
      mounts: [],
    });
  });

  it('allows an explicit display name override', async () => {
    const cwd = await tempRoot();

    const res = await HttpProxy.Config.add({ cwd, ...INPUT, name: 'proxy.app' });
    const doc = await readConfig(cwd);

    expect(res.config.name).to.eql('proxy.app');
    expect(doc.name).to.eql('proxy.app');
  });

  it('updates lifecycle fields while preserving root and mounts', async () => {
    const cwd = await tempRoot();
    await writeConfig(
      cwd,
      'name: old\nhostname: 0.0.0.0\nport: 3000\nroot:\n  target: http://127.0.0.1:4040/\nmounts:\n  - path: /payments/\n    target: http://127.0.0.1:4040/payments/\n',
    );

    const res = await HttpProxy.Config.add({ cwd, ...INPUT });
    const doc = await readConfig(cwd);

    expect(res.kind).to.eql('updated');
    expect(res.created).to.eql(false);
    expect(doc.name).to.eql('app');
    expect(doc.hostname).to.eql('127.0.0.1');
    expect(doc.port).to.eql(4040);
    expect(doc.root).to.eql({ target: 'http://127.0.0.1:4040/' });
    expect(doc.mounts).to.eql([
      { path: '/payments/', target: 'http://127.0.0.1:4040/payments/' },
    ]);
  });

  it('treats identical lifecycle fields as a no-op success', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, 'name: app\nhostname: 127.0.0.1\nport: 4040\nmounts: []\n');

    const res = await HttpProxy.Config.add({ cwd, ...INPUT });

    expect(res.kind).to.eql('exists');
    expect(res.created).to.eql(false);
  });

  it('does not write on dry-run', async () => {
    const cwd = await tempRoot();

    const res = await HttpProxy.Config.add({ cwd, ...INPUT, dryRun: true });

    expect(res.kind).to.eql('dry-run');
    expect(res.created).to.eql(true);
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('rejects invalid inputs before writing config', async () => {
    const cwd = await tempRoot();

    await expectError(
      () => HttpProxy.Config.add({ cwd, ...INPUT, port: '70000' }),
      'HttpProxy config add: --port must be an integer between 0 and 65535.',
    );
    await expectError(
      () => HttpProxy.Config.add({ cwd, ...INPUT, name: '' }),
      'HttpProxy config add: --name must not be empty.',
    );
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('rejects invalid existing reverse-proxy config', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, 'name: old\nhostname: 127.0.0.1\nport: nope\nmounts: []\n');

    await expectError(
      () => HttpProxy.Config.add({ cwd, ...INPUT }),
      "HttpProxy config add: config key 'port' must be an integer between 0 and 65535",
    );
  });

  it('rejects unknown existing reverse-proxy config keys', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, 'name: old\nhostname: 127.0.0.1\nport: 4040\nmounts: []\nextra: true\n');

    await expectError(
      () => HttpProxy.Config.add({ cwd, ...INPUT }),
      "HttpProxy config add: unknown config key 'extra'",
    );
  });
});

async function tempRoot() {
  return (await Fs.makeTempDir({ prefix: 'sys.http.proxy.config.' })).absolute;
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
