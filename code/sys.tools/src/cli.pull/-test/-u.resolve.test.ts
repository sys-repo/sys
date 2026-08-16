import { describe, expect, expectError, Fs, it, Str } from '../../-test.ts';
import { Pull } from '../mod.ts';

const CONFIG = '-config/@sys.tools.pull/view.yaml';
const INTEGRITY = `sha256-${'a'.repeat(64)}`;

describe('@sys/tools/pull materialization resolver', () => {
  it('resolves only configured mutable output directories', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.materialize.' })).absolute;
    const path = Fs.join(cwd, CONFIG);
    await Fs.write(path, yaml(), { force: true });

    const resolved = await Pull.resolve(path);

    expect(resolved.config).to.eql(path);
    expect(resolved.cwd).to.eql(cwd);
    expect(resolved.dir).to.eql(Fs.join(cwd, 'workspace'));
    expect(resolved.localDirs.map((dir) => dir.dir)).to.eql([
      'view/.pulled/driver.stripe',
      './view/releases/fixture',
    ]);
    expect(resolved.localDirs.map((dir) => dir.path)).to.eql([
      Fs.join(cwd, 'workspace/view/.pulled/driver.stripe'),
      Fs.join(cwd, 'workspace/view/releases/fixture'),
    ]);
    expect(resolved.localDirs.map((dir) => dir.bundle.kind)).to.eql([
      'dist',
      'github:release',
    ]);
  });

  it('does not present a sealed store as a mutable local output', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.materialize.' })).absolute;
    const path = Fs.join(cwd, CONFIG);
    await Fs.write(
      path,
      Str.dedent(`
        dir: .
        bundles:
          - kind: dist
            manifest: https://example.com/dist.json
            integrity: ${INTEGRITY}
            store: ./.dist-store
      `).trimStart(),
      { force: true },
    );

    const resolved = await Pull.resolve(path);
    expect(resolved.localDirs).to.eql([]);
  });

  it('fails before work when configured filesystem authorities overlap', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.materialize.' })).absolute;
    const path = Fs.join(cwd, CONFIG);
    await Fs.write(
      path,
      Str.dedent(`
        dir: .
        bundles:
          - kind: dist
            manifest: https://example.com/dist.json
            integrity: ${INTEGRITY}
            store: ./.dist-store
            project:
              dir: ./.dist-store/project
              mode: replace
      `).trimStart(),
      { force: true },
    );

    await expectError(() => Pull.resolve(path), 'filesystem authorities overlap');
  });

  it('returns no local directories when no bundles are declared', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.materialize.' })).absolute;
    const path = Fs.join(cwd, CONFIG);
    await Fs.write(path, `dir: .\n`, { force: true });

    const resolved = await Pull.resolve(path);
    expect(resolved.localDirs).to.eql([]);
  });

  it('fails clearly when the pull config cannot load', async () => {
    const cwd = (await Fs.makeTempDir({ prefix: 'sys.tools.pull.materialize.' })).absolute;
    const path = Fs.join(cwd, CONFIG);

    await expectError(() => Pull.resolve(path), 'Pull.resolve: failed to load config:');
  });
});

function yaml() {
  return Str.dedent(`
    dir: ./workspace
    bundles:
      - kind: dist
        manifest: https://fs.db.team/driver.stripe/dist.json
        integrity: ${INTEGRITY}
        store: ./.dist-store
        project:
          dir: view/.pulled/driver.stripe
          mode: replace
      - kind: dist
        manifest: https://fs.db.team/no-project/dist.json
        integrity: sha256-${'b'.repeat(64)}
        store: ./.dist-store
      - kind: github:release
        repo: sys/system
        tag: v1.0.0
        local:
          dir: ./view/releases/fixture
          mode: create
        limits:
          metadataBytes: 1000000
          entries: 100
          fileBytes: 10000000
          totalBytes: 50000000
          totalTime: 30000
  `).trimStart();
}
