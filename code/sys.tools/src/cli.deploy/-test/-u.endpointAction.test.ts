import { Cli, describe, expect, Fs, it, Pkg, Str } from '../../-test.ts';
import { runEndpointAction } from '../u.endpointAction.ts';
import { R2Provider } from '../u.providers/mod.ts';
import { captureInfo, providerlessPrebuiltStageYaml, withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy endpoint actions', () => {
  describe('stage', () => {
    it('stages providerless prebuilt artifact with source root and clear', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/stage.yaml`;
        await writePulledComponents(cwd, { includeSw: true });
        await Pkg.Dist.compute({ dir: `${cwd}/view/.pulled/ui.components`, save: true });

        await Fs.ensureDir(`${cwd}/.tmp/deploy/stage/stale`);
        await Fs.write(`${cwd}/.tmp/deploy/stage/stale/old.txt`, 'old');
        await Fs.write(`${cwd}/outside.txt`, 'outside');
        await Fs.write(yamlPath, providerlessPrebuiltStageYaml());

        const res = await runEndpointAction({
          cwd,
          key: 'stage',
          yamlPath,
          action: 'stage',
        });

        expect(res.ok).to.eql(true);
        expect(res.stageOk).to.eql(true);
        expect(await Fs.exists(`${cwd}/.tmp/deploy/stage/index.html`)).to.eql(true);
        expect(await Fs.exists(`${cwd}/.tmp/deploy/stage/sw.js`)).to.eql(true);
        expect(await Fs.exists(`${cwd}/.tmp/deploy/stage/assets/app.js`)).to.eql(true);
        expect(await Fs.exists(`${cwd}/.tmp/deploy/stage/stale/old.txt`)).to.eql(false);
        expect(await Fs.exists(`${cwd}/outside.txt`)).to.eql(true);

        const dist = await Fs.readJson(`${cwd}/.tmp/deploy/stage/dist.json`);
        expect(dist.ok).to.eql(true);
        expect(dist.exists).to.eql(true);
      });
    });

    it('resolves env refs before staging providerless prebuilt artifact', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/env-stage.yaml`;
        await writePulledComponents(cwd);
        await Pkg.Dist.compute({ dir: `${cwd}/view/.pulled/ui.components`, save: true });
        await Fs.write(
          `${cwd}/.env`,
          'SAMPLE_DEPLOY_SOURCE="view/.pulled/ui.components"\nSAMPLE_DEPLOY_STAGE="./.tmp/deploy/env-stage"\n',
        );
        await Fs.write(
          yamlPath,
          Str.dedent(`
            source:
              dir: .
            staging:
              dir: \${env:SAMPLE_DEPLOY_STAGE}
              clear: true
            mappings:
              - mode: copy
                dir:
                  source: \${env:SAMPLE_DEPLOY_SOURCE}
                  staging: .
          `).trimStart(),
        );

        const res = await runEndpointAction({
          cwd,
          key: 'env-stage',
          yamlPath,
          action: 'stage',
        });

        expect(res.ok).to.eql(true);
        expect(res.stageOk).to.eql(true);
        expect(await Fs.exists(`${cwd}/.tmp/deploy/env-stage/index.html`)).to.eql(true);
        expect(await Fs.exists(`${cwd}/.tmp/deploy/env-stage/assets/app.js`)).to.eql(true);
      });
    });

    it('copies configured mappings into the staging root', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/slc.yaml`;
        await writeSimpleSite(cwd, 'slc');
        await Fs.write(yamlPath, simpleCopyYaml());

        const res = await runEndpointAction({
          cwd,
          key: 'slc',
          yamlPath,
          action: 'stage',
        });

        expect(res.ok).to.eql(true);
        expect(res.stageOk).to.eql(true);
        expect(await Fs.exists(`${cwd}/stage/index.html`)).to.eql(true);
        expect(await Fs.exists(`${cwd}/stage/dist.json`)).to.eql(true);
      });
    });
  });

  describe('push', () => {
    it('rejects providerless endpoints even when staging output exists', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/stage.yaml`;
        await Fs.ensureDir(`${cwd}/.tmp/deploy/stage`);
        await Fs.write(
          `${cwd}/.tmp/deploy/stage/index.html`,
          '<!doctype html><html><body>staged</body></html>\n',
        );
        await Pkg.Dist.compute({ dir: `${cwd}/.tmp/deploy/stage`, save: true });
        await writePulledComponents(cwd);
        await Fs.write(yamlPath, providerlessPrebuiltStageYaml());

        const { value: res, output } = await captureInfo(() =>
          runEndpointAction({
            cwd,
            key: 'stage',
            yamlPath,
            action: 'push',
          })
        );

        expect(res.ok).to.eql(false);
        expect(res.push?.ok).to.eql(false);

        const text = Cli.stripAnsi(output);
        expect(text).to.include('reason: no-provider');
        expect(text).to.include('No provider configured for this endpoint.');
      });
    });

    describe('r2', () => {
      it('reports provider publish file stats without generic domain up-to-date check', async () => {
        await withTmpDir(async (cwd) => {
          const yamlPath = `${cwd}/-config/@sys.tools.deploy/r2.yaml`;
          await writeSimpleSite(cwd, 'source');
          await writeStagedSite(cwd, 'staged');
          await Fs.write(yamlPath, r2CopyYaml());

          await withMockedR2Push(
            async () => ({
              ok: true,
              publish: {
                files: [
                  { path: 'asset.bin', status: 'skipped' },
                  { path: 'index.html', status: 'skipped' },
                  { path: 'dist.json', status: 'skipped' },
                ],
              },
            }),
            async () => {
              const { value: res, output } = await captureInfo(() =>
                runEndpointAction({
                  cwd,
                  key: 'r2',
                  yamlPath,
                  action: 'push',
                })
              );

              expect(res.ok).to.eql(true);
              expect(res.push?.ok).to.eql(true);
              expect(publishFileStatuses(res.push?.publish)).to.eql([
                { path: 'asset.bin', status: 'skipped' },
                { path: 'index.html', status: 'skipped' },
                { path: 'dist.json', status: 'skipped' },
              ]);

              const text = Cli.stripAnsi(output);
              expect(text).to.include('Push Report for');
              expect(text).to.include('files');
              expect(text).to.include('3   total publish files');
              expect(text).to.include('uploaded');
              expect(text).to.include('0   changed files');
              expect(text).to.include('skipped');
              expect(text).to.include('3   unchanged files');
              expect(text).not.to.include('checking version https://cdn.example.com/dist.json');
            },
          );
        });
      });
    });
  });

  describe('stage-push', () => {
    it('preserves stage success when push is unavailable', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/slc.yaml`;
        await writeSimpleSite(cwd, 'slc');
        await Fs.write(yamlPath, noopCopyYaml());

        const res = await runEndpointAction({
          cwd,
          key: 'slc',
          yamlPath,
          action: 'stage-push',
        });

        expect(res.ok).to.eql(false);
        expect(res.stageOk).to.eql(true);
        expect(res.push?.ok).to.eql(false);
        expect(await Fs.exists(`${cwd}/stage/index.html`)).to.eql(true);
      });
    });
  });
});

async function writePulledComponents(
  cwd: string,
  opts: { readonly includeSw?: boolean } = {},
): Promise<void> {
  await Fs.ensureDir(`${cwd}/view/.pulled/ui.components/assets`);
  await Fs.write(
    `${cwd}/view/.pulled/ui.components/index.html`,
    '<!doctype html><html><body>ui.components</body></html>\n',
  );
  if (opts.includeSw) {
    await Fs.write(
      `${cwd}/view/.pulled/ui.components/sw.js`,
      'self.addEventListener("install", () => undefined);\n',
    );
  }
  await Fs.write(`${cwd}/view/.pulled/ui.components/assets/app.js`, 'export {};\n');
}

async function writeSimpleSite(cwd: string, body: string): Promise<void> {
  await Fs.ensureDir(`${cwd}/src/site`);
  await Fs.write(`${cwd}/src/site/index.html`, `<!doctype html><html>${body}</html>\n`);
}

async function writeStagedSite(cwd: string, body: string): Promise<void> {
  await Fs.ensureDir(`${cwd}/stage`);
  await Fs.write(`${cwd}/stage/index.html`, `<!doctype html><html>${body}</html>\n`);
  await Pkg.Dist.compute({ dir: `${cwd}/stage`, save: true });
}

async function withMockedR2Push<T>(
  push: typeof R2Provider.push,
  fn: () => Promise<T>,
): Promise<T> {
  const originalPush = R2Provider.push;
  const r2 = R2Provider as { push: typeof R2Provider.push };
  try {
    r2.push = push;
    return await fn();
  } finally {
    r2.push = originalPush;
  }
}

function publishFileStatuses(
  publish?: { readonly files?: readonly { readonly path: string; readonly status: string }[] },
): readonly { readonly path: string; readonly status: string }[] {
  return (publish?.files ?? []).map((file) => ({ path: file.path, status: file.status }));
}

function simpleCopyYaml(): string {
  return Str.dedent(`
    source:
      dir: ./src
    staging:
      dir: ./stage
    mappings:
      - mode: copy
        dir:
          source: ./site
          staging: .
  `).trimStart();
}

function noopCopyYaml(): string {
  return Str.dedent(`
    provider:
      kind: noop
    source:
      dir: ./src
    staging:
      dir: ./stage
    mappings:
      - mode: copy
        dir:
          source: ./site
          staging: .
  `).trimStart();
}

function r2CopyYaml(): string {
  return Str.dedent(`
    provider:
      kind: r2
      accountId: account-1
      bucket: deploy-bucket
      prefix: deploy/site
      readOrigin: https://cdn.example.com
      credentials:
        accessKeyId: key-1
        secretAccessKey: secret-1
    source:
      dir: ./src
    staging:
      dir: ./stage
    mappings:
      - mode: copy
        dir:
          source: ./site
          staging: .
  `).trimStart();
}
