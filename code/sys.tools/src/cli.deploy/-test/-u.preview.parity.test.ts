import { DistServer } from '@sys/server/dist/server';
import { describe, expect, Fs, Hash, it, Path, Pkg, Testing } from '../../-test.ts';
import type { t } from '../common.ts';
import { Deploy } from '../mod.ts';
import { DIST_VERIFY_LIMITS } from '../u.staging/u.verifyStagedDist.ts';
import { withTmpDir } from './u.fixture.ts';

const CONFIG = './-config/@sys.tools.deploy/parity.yaml';

describe('Deploy: staged artifact and standard Dist serving parity', () => {
  it('serves the exact staged root and revokes listener authority after mutation', async () => {
    await withTmpDir(async (cwd) => {
      await writeFixture(cwd);
      const staged = await Deploy.stage({ cwd, config: CONFIG });
      await assertExactStagedTree(staged);

      const port = Testing.randomPort();
      const started = await DistServer.Local.start({
        dir: staged.stagingRoot,
        limits: DIST_VERIFY_LIMITS,
        hostname: '127.0.0.1',
        port,
        silent: true,
        keyboard: false,
      });
      try {
        expect(new URL(started.origin).port).to.eql(String(port));
        assertEvidenceParity(staged.verification, started.verification);
        await assertCheckedResponse(
          started.origin,
          '/',
          staged.verification.dist.hash.parts['index.html'],
        );
        await assertCheckedResponse(started.origin, '/dist.json', staged.verification.integrity);
        await assertRefusedResponse(started.origin, '/unknown');
      } finally {
        await started.close('test.complete');
      }
      assertLoopbackPortAvailable(port);

      await Fs.write(
        `${staged.stagingRoot}/assets/app.js`,
        'export const changed = true;\n',
      );
      let refusal: unknown;
      try {
        await DistServer.Local.start({
          dir: staged.stagingRoot,
          limits: DIST_VERIFY_LIMITS,
          hostname: '127.0.0.1',
          port,
          silent: true,
          keyboard: false,
        });
      } catch (error) {
        refusal = error;
      }
      expect(DistServer.Error.is(refusal)).to.eql(true);
      if (DistServer.Error.is(refusal)) expect(refusal.reason).to.eql('content-mismatch');
      assertLoopbackPortAvailable(port);
    });
  });
});

/** Helpers: */
async function writeFixture(cwd: string): Promise<void> {
  await Fs.ensureDir(`${cwd}/source/copy`);
  await Fs.write(`${cwd}/source/copy/index.html`, '<h1>staged</h1>\n');
  await Fs.ensureDir(`${cwd}/source/copy/assets`);
  await Fs.write(`${cwd}/source/copy/assets/app.js`, 'export const ready = true;\n');

  await Fs.ensureDir(`${cwd}/-config/@sys.tools.deploy`);
  await Fs.write(
    `${cwd}/${CONFIG}`,
    [
      'source:',
      '  dir: ./source',
      'staging:',
      '  dir: ./stage',
      'mappings:',
      '  - mode: copy',
      '    dir:',
      '      source: ./copy',
      '      staging: .',
      '',
    ].join('\n'),
  );
}

async function assertExactStagedTree(staged: t.DeployTool.StageResult): Promise<void> {
  const actual = await regularFiles(staged.stagingRoot);
  const declared = Object.keys(staged.verification.dist.hash.parts).toSorted();
  expect(actual).to.eql([...declared, 'dist.json'].toSorted());
}

function assertEvidenceParity(
  staged: t.Pkg.Dist.Local.Verify.Evidence,
  preview: t.Pkg.Dist.Local.Verify.Evidence,
): void {
  expect(preview.integrity).to.eql(staged.integrity);
  expect(preview.dist.hash.digest).to.eql(staged.dist.hash.digest);
  expect(preview.dist.hash.parts).to.eql(staged.dist.hash.parts);
  expect(preview.manifestBytes).to.eql(staged.manifestBytes);
  expect(preview.assets).to.eql(staged.assets);
}

async function assertCheckedResponse(
  origin: t.StringUrl,
  path: string,
  checksum: string | undefined,
): Promise<void> {
  const expected = Pkg.Dist.Part.hash(checksum);
  if (!expected) throw new Error(`Missing staged checksum for preview path: ${path}`);
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

function assertLoopbackPortAvailable(port: number): void {
  const listener = Deno.listen({ hostname: '127.0.0.1', port });
  listener.close();
}
