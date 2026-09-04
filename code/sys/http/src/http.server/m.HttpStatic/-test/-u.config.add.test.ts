import { describe, expect, expectError, Fs, it, type t, Yaml } from '../../../-test.ts';
import { HttpStatic } from '../mod.ts';

const CONFIG = 'view';
const CONFIG_PATH = '-config/@sys.http/static/view.yaml';
const INPUT = {
  config: CONFIG,
  dir: '.',
  hostname: '127.0.0.1',
  port: 4040,
} as const;

describe('HttpStatic.Config.add', () => {
  it('creates a missing static config with default server fields', async () => {
    const cwd = await tempRoot();

    const res = await HttpStatic.Config.add({ cwd, config: CONFIG });
    const doc = await readConfig(cwd);

    expect(res.kind).to.eql('added');
    expect(res.created).to.eql(true);
    expect(doc).to.eql({
      name: 'view',
      dir: '.',
      hostname: '127.0.0.1',
      port: 4040,
    });
  });

  it('allows an explicit display name override', async () => {
    const cwd = await tempRoot();

    const res = await HttpStatic.Config.add({ cwd, ...INPUT, name: 'ui' });
    const doc = await readConfig(cwd);

    expect(res.config.name).to.eql('ui');
    expect(doc.name).to.eql('ui');
  });

  it('updates an existing different static config', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, 'name: old\ndir: ./public\nhostname: 127.0.0.1\nport: 3000\n');

    const res = await HttpStatic.Config.add({ cwd, ...INPUT });
    const doc = await readConfig(cwd);

    expect(res.kind).to.eql('updated');
    expect(res.created).to.eql(false);
    expect(doc.port).to.eql(4040);
    expect(doc.name).to.eql('view');
  });

  it('treats an identical static config as a no-op success', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, 'name: view\ndir: .\nhostname: 127.0.0.1\nport: 4040\n');

    const res = await HttpStatic.Config.add({ cwd, ...INPUT });

    expect(res.kind).to.eql('exists');
    expect(res.created).to.eql(false);
  });

  it('does not write on dry-run', async () => {
    const cwd = await tempRoot();

    const res = await HttpStatic.Config.add({ cwd, ...INPUT, dryRun: true });

    expect(res.kind).to.eql('dry-run');
    expect(res.created).to.eql(true);
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('rejects invalid inputs before writing config', async () => {
    const cwd = await tempRoot();

    await expectError(
      () => HttpStatic.Config.add({ cwd, ...INPUT, port: '70000' }),
      'HttpStatic config add: --port must be an integer between 0 and 65535.',
    );
    await expectError(
      () => HttpStatic.Config.add({ cwd, ...INPUT, name: '' }),
      'HttpStatic config add: --name must not be empty.',
    );
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('rejects invalid existing static config', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, 'name: old\ndir: .\nhostname: 127.0.0.1\nport: nope\n');

    await expectError(
      () => HttpStatic.Config.add({ cwd, ...INPUT }),
      "HttpStatic config add: config key 'port' must be an integer between 0 and 65535",
    );
  });

  it('rejects unknown existing static config keys', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, 'name: old\ndir: .\nhostname: 127.0.0.1\nport: 4040\nextra: true\n');

    await expectError(
      () => HttpStatic.Config.add({ cwd, ...INPUT }),
      "HttpStatic config add: unknown config key 'extra'",
    );
  });
});

async function tempRoot() {
  return (await Fs.makeTempDir({ prefix: 'sys.http.static.config.' })).absolute;
}

async function writeConfig(cwd: string, text: string) {
  await Fs.write(Fs.join(cwd, CONFIG_PATH), text, { force: true });
}

async function readConfig(cwd: string): Promise<t.HttpStatic.ConfigDoc> {
  const read = await Fs.readText(Fs.join(cwd, CONFIG_PATH));
  if (!read.ok) throw new Error('failed to read test config');
  const parsed = Yaml.parse<t.HttpStatic.ConfigDoc>(read.data ?? '');
  if (parsed.error || !parsed.data) throw new Error('failed to parse test config');
  return parsed.data;
}
