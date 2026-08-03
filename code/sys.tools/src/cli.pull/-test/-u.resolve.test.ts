import { describe, expect, expectError, Fs, it, Str } from '../../-test.ts';
import { Pull } from '../mod.ts';

const CONFIG = '-config/@sys.tools.pull/view.yaml';

describe('@sys/tools/pull materialization resolver', () => {
  it('resolves configured local materialization directories', async () => {
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
    expect(resolved.localDirs.map((dir) => dir.bundle.kind)).to.eql(['http', 'github:release']);
    const [http, github] = resolved.localDirs.map((dir) => dir.bundle);
    expect(http?.kind).to.eql('http');
    expect(http?.kind === 'http' ? http.local.clear : undefined).to.eql(true);
    expect(github?.kind).to.eql('github:release');
    expect(github?.kind === 'github:release' ? github.local.mode : undefined).to.eql('create');
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
    defaults:
      http:
        clear: true
    bundles:
      - kind: http
        dist: https://fs.db.team/driver.stripe/dist.json
        local:
          dir: view/.pulled/driver.stripe
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
