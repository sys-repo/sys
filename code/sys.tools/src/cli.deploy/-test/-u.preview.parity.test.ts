import { DistServer } from '@sys/server/dist/server';
import { describe, expect, expectError, it, Testing } from '../../-test.ts';
import { Fs, Hash, Is, Net, Obj, Path, Pkg, Str } from '../../common.ts';
import type { t } from '../common.ts';
import { Deploy } from '../mod.ts';
import { DIST_VERIFY_LIMITS } from '../u.staging/u.verifyStagedDist.ts';
import { withTmpDir } from './u.fixture.ts';

const CONFIG = './-config/@sys.tools.deploy/parity.yaml';

describe('Deploy: staged artifact and standard Dist serving parity', () => {
  it('serves the exact staged root and revokes listener authority after mutation', () => {
    return withTmpDir(assertServingParity);
  });
});

/**
 * Helpers:
 */
async function assertServingParity(cwd: string): Promise<void> {
  await writeFixture(cwd);
  const staged = await Deploy.stage({ cwd, config: CONFIG });
  await assertExactStagedTree(staged);

  const port = Testing.randomPort();
  const options = {
    dir: staged.stagingRoot,
    limits: DIST_VERIFY_LIMITS,
    hostname: '127.0.0.1',
    port,
    silent: true,
    keyboard: false,
  };
  const started = await DistServer.Local.start(options);
  try {
    const { origin } = started;
    const { content, manifestChecksum } = staged.verification;
    expect(new URL(origin).port).to.eql(`${port}`);

    // Negative control: the release assertion must reject a live listener.
    await expectError(() => assertPortReleased(port));
    assertEvidenceParity(staged.verification, started.verification);
    await assertCheckedResponse(origin, '/', content.parts['index.html']);
    await assertCheckedResponse(origin, '/dist.json', manifestChecksum);
    await assertRefusedResponse(origin, '/unknown');
  } finally {
    await started.close('test.complete');
  }
  await assertPortReleased(port);

  await Fs.write(Fs.join(staged.stagingRoot, 'assets/app.js'), 'export const changed = true;\n');
  const refusal = await expectError(async () => {
    const unexpected = await DistServer.Local.start(options);
    await unexpected.close('test.unexpected-start');
  });
  expect(DistServer.Error.is(refusal)).to.eql(true);
  if (DistServer.Error.is(refusal)) expect(refusal.reason).to.eql('content-mismatch');
  await assertPortReleased(port);
}

async function writeFixture(cwd: string): Promise<void> {
  const source = Fs.join(cwd, 'source/copy');
  const config = Fs.join(cwd, CONFIG);
  const yaml = Str.dedent(`
    source:
      dir: ./source
    staging:
      dir: ./stage
    mappings:
      - mode: copy
        dir:
          source: ./copy
          staging: .
  `);
  await Fs.ensureDir(Fs.join(source, 'assets'));
  await Fs.write(Fs.join(source, 'index.html'), '<h1>staged</h1>\n');
  await Fs.write(Fs.join(source, 'assets/app.js'), 'export const ready = true;\n');
  await Fs.ensureDir(Fs.dirname(config));
  await Fs.write(config, yaml);
}

async function assertExactStagedTree(staged: t.DeployTool.StageResult): Promise<void> {
  const actual = await regularFiles(staged.stagingRoot);
  const declared = Obj.keys(staged.verification.content.parts);
  expect(actual).to.eql([...declared, 'dist.json'].toSorted());
}

function assertEvidenceParity(
  staged: t.Pkg.Dist.Local.Verify.Evidence,
  preview: t.Pkg.Dist.Local.Verify.Evidence,
): void {
  expect(preview.manifestChecksum).to.eql(staged.manifestChecksum);
  expect(preview.content).to.eql(staged.content);
  expect(preview.manifestBytes).to.eql(staged.manifestBytes);
  expect(preview.assets).to.eql(staged.assets);
}

async function assertCheckedResponse(
  origin: t.StringUrl,
  path: string,
  checksum: string | undefined,
): Promise<void> {
  const expected = Pkg.Dist.Part.hash(checksum);
  if (!Is.str(expected)) throw new Error(`Missing staged checksum for preview path: ${path}`);
  const response = await fetch(`${origin}${path}`);
  expect(response.status).to.eql(200);
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect(Hash.sha256(bytes)).to.eql(expected);
}

async function assertRefusedResponse(origin: t.StringUrl, path: string): Promise<void> {
  const response = await fetch(`${origin}${path}`);
  expect(response.status).to.eql(404);
  await response.body?.cancel();
}

async function regularFiles(root: t.StringDir): Promise<readonly string[]> {
  const entries = await Fs.glob(root, { includeDirs: false }).find('**/*');
  return entries.map((entry) => {
    const relative = Path.relative(root, entry.path);
    if (Path.Is.absolute(relative) || !Path.Is.within(root, entry.path)) {
      throw new Error(`Deploy parity fixture file escaped its staging root: ${entry.path}`);
    }
    return Path.relativePosix(relative);
  }).toSorted();
}

async function assertPortReleased(port: number): Promise<void> {
  const connection = await Testing.connect(port, { hostname: '127.0.0.1' });
  expect(connection.refused).to.eql(true);
  expect(connection.error?.name).to.eql('ConnectionRefused');
  expect(Net.Port.inUse(port)).to.eql(false);
}
