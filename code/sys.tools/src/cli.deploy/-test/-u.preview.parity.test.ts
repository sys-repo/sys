import { DistServer } from '@sys/server/dist/server';
import { describe, expect, Fs, Hash, it, Path, Pkg, Testing } from '../../-test.ts';
import type { t } from '../common.ts';
import { Deploy } from '../mod.ts';
import { runDeployPreviewSessionWith } from '../u.preview.ts';
import { DEPLOY_DIST_VERIFY_LIMITS } from '../u.staging/u.verifyStagedDist.ts';
import { withTmpDir } from './u.fixture.ts';
import { createPreviewPromptStarted } from './u.preview.fixture.ts';

const CONFIG = './-config/@sys.tools.deploy/parity.yaml';

describe('Deploy: staged artifact and preview authority parity', () => {
  it('preserves one exact staged Dist across verified loopback preview generations and revokes it on mutation', async () => {
    await withTmpDir(async (cwd) => {
      await writeFixture(cwd);
      const staged = await stageFixture(cwd);
      await assertExactStagedTree(staged);

      const port = Testing.randomPort();
      const started: t.DeployPreview.Started[] = [];
      const opened: string[] = [];
      let prompts = 0;
      const preview = await runDeployPreviewSessionWith(
        { cwd, dir: staged.stagingRoot, name: 'parity', port },
        {
          start: async (input) => {
            const listener = await DistServer.Local.start(input);
            started.push(listener);
            assertEvidenceParity(staged.verification, listener.verification);
            return listener;
          },
          prompt(input) {
            prompts += 1;
            expect(new URL(input.origin).port).to.eql(String(port));
            if (prompts === 1) {
              return createPreviewPromptStarted((async () => {
                await assertCheckedResponse(
                  input.origin,
                  '/',
                  staged.verification.dist.hash.parts['index.html'],
                );
                await assertCheckedResponse(
                  input.origin,
                  '/assets/app.js',
                  staged.verification.dist.hash.parts['assets/app.js'],
                );
                await assertCheckedResponse(
                  input.origin,
                  '/assets/editor.js',
                  staged.verification.dist.hash.parts['assets/editor.js'],
                );
                await assertCheckedResponse(
                  input.origin,
                  '/assets/editor/worker.js',
                  staged.verification.dist.hash.parts['assets/editor/worker.js'],
                );
                await assertCheckedResponse(
                  input.origin,
                  '/built/built.txt',
                  staged.verification.dist.hash.parts['built/built.txt'],
                );
                await assertCheckedResponse(
                  input.origin,
                  '/landing/index.html',
                  staged.verification.dist.hash.parts['landing/index.html'],
                );
                await assertCheckedResponse(
                  input.origin,
                  '/dist.json',
                  staged.verification.integrity,
                );
                await assertRefusedResponse(input.origin, '/landing/');
                await assertRefusedResponse(input.origin, '/unknown');
                return choiceAt(input.choices, '/landing/index.html');
              })());
            }
            if (prompts === 2) return createPreviewPromptStarted({ kind: 'reload' });
            return createPreviewPromptStarted({ kind: 'back' });
          },
          open(_cwd, url) {
            opened.push(url);
          },
        },
      );

      expect(preview).to.eql({ ok: true });
      expect(started.length).to.eql(2);
      expect(opened).to.eql([`${started[0]?.origin}/landing/index.html`]);
      assertLoopbackPortAvailable(port);

      await mutateManifestMetadata(staged);
      await assertPreviewRevoked(cwd, staged.stagingRoot, 'malformed');

      const restagedAsset = await stageFixture(cwd);
      await Fs.write(
        `${restagedAsset.stagingRoot}/assets/app.js`,
        'export const changed = true;\n',
      );
      await assertPreviewRevoked(cwd, restagedAsset.stagingRoot, 'content-mismatch');

      const restagedExtra = await stageFixture(cwd);
      await Fs.write(`${restagedExtra.stagingRoot}/undeclared.txt`, 'undeclared\n');
      await assertPreviewRevoked(cwd, restagedExtra.stagingRoot, 'unexpected-entry');

      const restagedLimit = await stageFixture(cwd);
      await exceedEntryLimit(restagedLimit.stagingRoot);
      await assertPreviewRevoked(cwd, restagedLimit.stagingRoot, 'limit-exceeded');
    });
  });
});

/** Helpers: */
async function writeFixture(cwd: string): Promise<void> {
  await Fs.ensureDir(`${cwd}/source/copy/editor`);
  await Fs.write(`${cwd}/source/copy/app.js`, 'export const ready = true;\n');
  await Fs.write(`${cwd}/source/copy/editor.js`, 'export const editor = true;\n');
  await Fs.write(`${cwd}/source/copy/editor/worker.js`, 'export const worker = true;\n');

  await Fs.ensureDir(`${cwd}/source/builder/dist`);
  await Fs.write(`${cwd}/source/builder/dist/built.txt`, 'built artifact\n');
  await Fs.write(
    `${cwd}/source/builder/deno.json`,
    '{"tasks":{"test":"deno eval \'\'","build":"deno eval \'\'"}}\n',
  );

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
      '      staging: ./assets',
      '  - mode: build+copy',
      '    dir:',
      '      source: ./builder',
      '      staging: ./built',
      '  - mode: index',
      '    dir:',
      '      source: .',
      '      staging: ./landing',
      '',
    ].join('\n'),
  );
}

async function stageFixture(cwd: t.StringDir): Promise<t.DeployTool.StageResult> {
  return await Deploy.stage({ cwd, config: CONFIG });
}

async function assertExactStagedTree(staged: t.DeployTool.StageResult): Promise<void> {
  const actual = await regularFiles(staged.stagingRoot);
  const declared = Object.keys(staged.verification.dist.hash.parts).toSorted();
  expect(actual).to.eql([...declared, 'dist.json'].toSorted());
  expect(actual.filter((path) => path.endsWith('/dist.json'))).to.eql([]);
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

function choiceAt(
  choices: readonly t.DeployPreview.Choice[],
  path: string,
): t.DeployPreview.Choice {
  const choice = choices.find((item) => item.path === path);
  if (!choice) throw new Error(`Missing verified preview choice: ${path}`);
  return choice;
}

async function mutateManifestMetadata(staged: t.DeployTool.StageResult): Promise<void> {
  const path = `${staged.stagingRoot}/dist.json`;
  const manifest = (await Fs.readText(path)).data;
  const checksum = Pkg.Dist.Part.hash(staged.verification.dist.hash.parts['assets/app.js']);
  if (!manifest || !checksum) throw new Error('Missing staged manifest metadata fixture.');
  const changed = manifest.replace(checksum, `sha256-${'0'.repeat(64)}`);
  if (changed === manifest) throw new Error('Could not mutate staged manifest metadata.');
  await Fs.write(path, changed);
}

async function assertPreviewRevoked(
  cwd: t.StringDir,
  dir: t.StringDir,
  reason: t.DeployPreview.FailureReason,
): Promise<void> {
  const port = Testing.randomPort();
  let prompts = 0;
  const result = await runDeployPreviewSessionWith(
    { cwd, dir, name: 'parity-refusal', port },
    {
      start: DistServer.Local.start,
      prompt: () => {
        prompts += 1;
        return createPreviewPromptStarted({ kind: 'back' });
      },
      open: () => undefined,
    },
  );

  expect(result).to.eql({ ok: false, reason });
  expect(prompts).to.eql(0);
  assertLoopbackPortAvailable(port);
}

async function exceedEntryLimit(root: t.StringDir): Promise<void> {
  const observed = (await Fs.glob(root, { includeDirs: true }).find('**/*')).length;
  const files = Math.max(1, DEPLOY_DIST_VERIFY_LIMITS.entries - observed);
  await Fs.ensureDir(`${root}/limit`);
  const batchSize = 64;
  for (let start = 0; start < files; start += batchSize) {
    const end = Math.min(files, start + batchSize);
    await Promise.all(
      Array.from({ length: end - start }, (_, offset) => {
        const name = String(start + offset).padStart(5, '0');
        return Fs.write(`${root}/limit/${name}.txt`, '');
      }),
    );
  }
}

async function regularFiles(root: t.StringDir): Promise<readonly string[]> {
  const entries = await Fs.glob(root, { includeDirs: false }).find('**/*');
  const files = entries.map((entry) => {
    const relative = Path.relative(root, entry.path);
    if (Path.Is.absolute(relative) || !Path.Is.within(root, entry.path)) {
      throw new Error(`Deploy parity fixture file escaped its staging root: ${entry.path}`);
    }
    return Path.relativePosix(relative);
  });
  return Object.freeze(files.toSorted());
}

function assertLoopbackPortAvailable(port: number): void {
  const listener = Deno.listen({ hostname: '127.0.0.1', port });
  listener.close();
}
