import { describe, expect, expectError, Fs, it, Str } from '../../-test.ts';
import { addHttpBundle } from '../u.add.ts';
import { PullFs } from '../u.yaml/mod.ts';

const CONFIG = './-config/@sys.tools.pull/components.yaml';
const DIST = 'https://example.com/ui.components/dist.json';
const LOCAL = './view/components';

describe('@sys/tools/pull add', () => {
  it('creates a missing config by default', async () => {
    const cwd = await tempRoot();
    const res = await addHttpBundle({
      cwd,
      config: CONFIG,
      dist: DIST,
      local: LOCAL,
    });

    const loaded = await PullFs.loadLocation(Fs.join(cwd, CONFIG));
    expect(res.kind).to.eql('added');
    expect(res.createdConfig).to.eql(true);
    expect(loaded.ok).to.eql(true);
    if (loaded.ok) {
      expect(loaded.location.bundles).to.eql([
        {
          kind: 'http',
          dist: DIST,
          local: { dir: LOCAL },
        },
      ]);
    }
  });

  it('appends an HTTP bundle to an existing config', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, `dir: .\n`);

    const res = await addHttpBundle({ cwd, config: CONFIG, dist: DIST, local: LOCAL });
    const loaded = await PullFs.loadLocation(Fs.join(cwd, CONFIG));

    expect(res.kind).to.eql('added');
    expect(res.createdConfig).to.eql(false);
    if (loaded.ok) expect(loaded.location.bundles?.[0]?.local.dir).to.eql(LOCAL);
  });

  it('treats an exact duplicate as a no-op success', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, yaml(DIST, LOCAL));

    const res = await addHttpBundle({ cwd, config: CONFIG, dist: DIST, local: LOCAL });

    expect(res.kind).to.eql('exists');
    expect(res.createdConfig).to.eql(false);
  });

  it('rejects a reused local target with a different source', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, yaml('https://example.com/other/dist.json', LOCAL));

    await expectError(
      () => addHttpBundle({ cwd, config: CONFIG, dist: DIST, local: LOCAL }),
      'Pull add: local target already used by a different bundle',
    );
  });

  it('does not write on dry-run', async () => {
    const cwd = await tempRoot();

    const res = await addHttpBundle({
      cwd,
      config: CONFIG,
      dist: DIST,
      local: LOCAL,
      dryRun: true,
    });

    expect(res.kind).to.eql('dry-run');
    expect(res.createdConfig).to.eql(true);
    expect(await Fs.exists(Fs.join(cwd, CONFIG))).to.eql(false);
  });

  it('rejects unsafe local targets before writing config', async () => {
    const cwd = await tempRoot();

    await expectError(
      () => addHttpBundle({ cwd, config: CONFIG, dist: DIST, local: '.' }),
      'Pull add: --local must be a child directory under the config root.',
    );
    await expectError(
      () =>
        addHttpBundle({
          cwd,
          config: CONFIG,
          dist: DIST,
          local: './view/..',
        }),
      'Pull add: --local must not traverse outside the config root.',
    );
    expect(await Fs.exists(Fs.join(cwd, CONFIG))).to.eql(false);
  });
});

async function tempRoot() {
  return (await Fs.makeTempDir({ prefix: 'sys.tools.pull.add.' })).absolute;
}

async function writeConfig(cwd: string, text: string) {
  await Fs.write(Fs.join(cwd, CONFIG), text, { force: true });
}

function yaml(dist: string, local: string) {
  return Str.dedent(`
    dir: .
    bundles:
      - kind: http
        dist: ${dist}
        local:
          dir: ${local}
  `).trimStart();
}
