import { describe, expect, expectError, Fs, it, Str } from '../../-test.ts';
import { addDistBundle } from '../u.add.ts';
import { PullFs } from '../u.yaml/mod.ts';

const CONFIG = './-config/@sys.tools.pull/components.yaml';
const MANIFEST = 'https://example.com/ui.components/dist.json';
const INTEGRITY = `sha256-${'a'.repeat(64)}`;
const STORE = './.dist-store';
const PROJECT = './view/components';

describe('@sys/tools/pull add', () => {
  it('creates a missing config with explicit pin and immutable store authority', async () => {
    const cwd = await tempRoot();
    const res = await addDistBundle(input(cwd));

    const loaded = await PullFs.loadLocation(Fs.join(cwd, CONFIG));
    expect(res.kind).to.eql('added');
    expect(res.createdConfig).to.eql(true);
    expect(loaded.ok).to.eql(true);
    if (loaded.ok) {
      expect(loaded.location.bundles).to.eql([
        {
          kind: 'dist',
          manifest: MANIFEST,
          integrity: INTEGRITY,
          store: STORE,
          project: { dir: PROJECT, mode: 'replace' },
        },
      ]);
    }
  });

  it('appends a pinned Dist bundle to an existing config', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, `dir: .\n`);

    const res = await addDistBundle(input(cwd));
    const loaded = await PullFs.loadLocation(Fs.join(cwd, CONFIG));

    expect(res.kind).to.eql('added');
    expect(res.createdConfig).to.eql(false);
    if (loaded.ok) {
      const bundle = loaded.location.bundles?.[0];
      expect(bundle?.kind).to.eql('dist');
      expect(bundle?.kind === 'dist' ? bundle.project?.dir : undefined).to.eql(PROJECT);
    }
  });

  it('treats an exact duplicate as a no-op success', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, yaml());

    const res = await addDistBundle(input(cwd));

    expect(res.kind).to.eql('exists');
    expect(res.createdConfig).to.eql(false);
  });

  it('rejects a reused mutable projection target', async () => {
    const cwd = await tempRoot();
    await writeConfig(cwd, yaml(`sha256-${'b'.repeat(64)}`));

    await expectError(
      () => addDistBundle(input(cwd)),
      'Pull add: projection target already used',
    );
  });

  it('requires publisher-provided integrity and never synthesizes a pin', async () => {
    const cwd = await tempRoot();

    await expectError(
      () => addDistBundle({ ...input(cwd), integrity: '' }),
      'Pull add: --integrity must be a canonical publisher-provided SHA-256.',
    );
    await expectError(
      () => addDistBundle({ ...input(cwd), integrity: `sha256-${'A'.repeat(64)}` }),
      'Pull add: --integrity must be a canonical publisher-provided SHA-256.',
    );
    expect(await Fs.exists(Fs.join(cwd, CONFIG))).to.eql(false);
  });

  it('requires explicit projection mutation authority and store isolation', async () => {
    const cwd = await tempRoot();

    await expectError(
      () => addDistBundle({ ...input(cwd), mode: undefined }),
      'Pull add: --project requires --mode create|replace.',
    );
    await expectError(
      () => addDistBundle({ ...input(cwd), project: STORE }),
      'Pull add: --project must be separate from the immutable --store.',
    );
    expect(await Fs.exists(Fs.join(cwd, CONFIG))).to.eql(false);
  });

  it('does not write on dry-run', async () => {
    const cwd = await tempRoot();
    const res = await addDistBundle({ ...input(cwd), dryRun: true });

    expect(res.kind).to.eql('dry-run');
    expect(res.createdConfig).to.eql(true);
    expect(await Fs.exists(Fs.join(cwd, CONFIG))).to.eql(false);
  });

  it('rejects unsafe store and projection targets before writing config', async () => {
    const cwd = await tempRoot();

    await expectError(
      () => addDistBundle({ ...input(cwd), store: '.' }),
      'Pull add: --store must be a child directory under the config root.',
    );
    await expectError(
      () => addDistBundle({ ...input(cwd), project: './view/..' }),
      'Pull add: --project must not traverse outside the config root.',
    );
    expect(await Fs.exists(Fs.join(cwd, CONFIG))).to.eql(false);
  });
});

function input(cwd: string) {
  return {
    cwd,
    config: CONFIG,
    manifest: MANIFEST,
    integrity: INTEGRITY,
    store: STORE,
    project: PROJECT,
    mode: 'replace' as const,
  };
}

async function tempRoot() {
  return (await Fs.makeTempDir({ prefix: 'sys.tools.pull.add.' })).absolute;
}

async function writeConfig(cwd: string, text: string) {
  await Fs.write(Fs.join(cwd, CONFIG), text, { force: true });
}

function yaml(integrity = INTEGRITY) {
  return Str.dedent(`
    dir: .
    bundles:
      - kind: dist
        manifest: ${MANIFEST}
        integrity: ${integrity}
        store: ${STORE}
        project:
          dir: ${PROJECT}
          mode: replace
  `).trimStart();
}
