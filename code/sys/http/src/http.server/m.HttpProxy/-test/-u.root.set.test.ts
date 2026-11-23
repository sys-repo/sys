import { describe, expect, expectError, Fs, it, Str, type t, Yaml } from '../../../-test.ts';
import { HttpProxy } from '../mod.ts';

const CONFIG = 'app';
const CONFIG_PATH = '-config/@sys.http/proxy/app.yaml';
const INPUT = {
  config: CONFIG,
  upstream: 'http://127.0.0.1:4040/',
} as const;

describe('HttpProxy.Root.set', () => {
  it('creates a missing config before setting the root upstream', async () => {
    const cwd = await tempRoot();

    const res = await HttpProxy.Root.set({ cwd, ...INPUT });
    const doc = await readConfig(cwd);

    expect(res.kind).to.eql('added');
    expect(res.created).to.eql(true);
    expect(doc).to.eql({
      name: 'app',
      hostname: '127.0.0.1',
      port: 4040,
      root: { target: 'http://127.0.0.1:4040/' },
      mounts: [],
    });
  });

  it('sets root on an existing config while preserving mounts', async () => {
    const cwd = await tempRoot();
    await writeConfig(
      cwd,
      'name: app\nhostname: 127.0.0.1\nport: 4040\nmounts:\n  - path: /payments/\n    target: http://127.0.0.1:4040/payments/\n',
    );

    const res = await HttpProxy.Root.set({ cwd, ...INPUT });
    const doc = await readConfig(cwd);

    expect(res.kind).to.eql('updated');
    expect(res.created).to.eql(false);
    expect(doc.root).to.eql({ target: 'http://127.0.0.1:4040/' });
    expect(doc.mounts).to.eql([
      { path: '/payments/', target: 'http://127.0.0.1:4040/payments/' },
    ]);
  });

  for (const setting of [undefined, false, true] as const) {
    it(`root target edit preserves stripAuthorization: ${setting ?? 'omitted'}`, async () => {
      const cwd = await tempRoot();
      const upstream = 'http://127.0.0.1:3000/';
      const source = rootYaml(upstream, setting);
      await writeConfig(cwd, source);

      const same = await HttpProxy.Root.set({ cwd, ...INPUT, upstream });
      expect(same.kind).to.eql('exists');
      expect(same.created).to.eql(false);
      expect(await readConfigText(cwd)).to.eql(source);

      const updated = await HttpProxy.Root.set({ cwd, ...INPUT });
      expect(updated.kind).to.eql('updated');
      const policy = setting === undefined ? {} : { stripAuthorization: setting };
      expect((await readConfig(cwd)).root).to.eql({ target: INPUT.upstream, ...policy });
    });
  }

  const invalid = [
    ['quoted boolean', '"true"', 'root.stripAuthorization must be a boolean'],
    ['malformed YAML', '[', 'invalid config YAML'],
  ] as const;
  for (const [label, scalar, message] of invalid) {
    it(`rejects ${label} without changing the file`, async () => {
      const cwd = await tempRoot();
      const source = rootYaml('http://127.0.0.1:3000/', scalar);
      await writeConfig(cwd, source);
      await expectError(() => HttpProxy.Root.set({ cwd, ...INPUT }), message);
      expect(await readConfigText(cwd)).to.eql(source);
    });
  }

  it('does not write on dry-run', async () => {
    const cwd = await tempRoot();

    const res = await HttpProxy.Root.set({ cwd, ...INPUT, dryRun: true });

    expect(res.kind).to.eql('dry-run');
    expect(res.created).to.eql(true);
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('rejects invalid root inputs before writing config', async () => {
    const cwd = await tempRoot();

    await expectError(
      () => HttpProxy.Root.set({ cwd, ...INPUT, upstream: 'http://127.0.0.1:4040/app' }),
      'HttpProxy root set: invalid root upstream: http://127.0.0.1:4040/app',
    );
    await expectError(
      () => HttpProxy.Root.set({ cwd, ...INPUT, upstream: 'http://127.0.0.1:4040/?x=1' }),
      'HttpProxy root set: invalid root upstream: http://127.0.0.1:4040/?x=1',
    );
    expect(await Fs.exists(Fs.join(cwd, CONFIG_PATH))).to.eql(false);
  });

  it('rejects invalid existing root config', async () => {
    const cwd = await tempRoot();
    await writeConfig(
      cwd,
      'name: app\nhostname: 127.0.0.1\nport: 4040\nroot:\n  target: http://127.0.0.1:4040/app\nmounts: []\n',
    );

    await expectError(
      () => HttpProxy.Root.set({ cwd, ...INPUT }),
      'HttpProxy root set: invalid root upstream: http://127.0.0.1:4040/app',
    );
  });
});

function rootYaml(target: string, policyScalar?: boolean | string) {
  return Str.dedent(`
    # Keep this operator comment on a no-op or rejected edit.
    name: app
    hostname: 127.0.0.1
    port: 4040
    mounts: []
    root:
      target: ${target}
      ${policyScalar === undefined ? '' : `stripAuthorization: ${policyScalar}`}
  `);
}

async function tempRoot() {
  return (await Fs.makeTempDir({ prefix: 'sys.http.proxy.root.' })).absolute;
}

async function writeConfig(cwd: string, text: string) {
  await Fs.write(Fs.join(cwd, CONFIG_PATH), text, { force: true });
}

async function readConfigText(cwd: string): Promise<string> {
  const read = await Fs.readText(Fs.join(cwd, CONFIG_PATH));
  if (!read.ok || read.data === undefined) throw new Error('failed to read test config');
  return read.data;
}

async function readConfig(cwd: string): Promise<t.HttpProxy.Config.Doc> {
  const parsed = Yaml.parse<t.HttpProxy.Config.Doc>(await readConfigText(cwd));
  if (parsed.error || !parsed.data) throw new Error('failed to parse test config');
  return parsed.data;
}
