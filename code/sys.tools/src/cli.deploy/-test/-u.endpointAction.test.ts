import { Cli, describe, expect, Fs, it, Pkg, Str } from '../../-test.ts';
import type { t } from '../common.ts';
import {
  DEPLOY_PREVIEW_PORT,
  runEndpointAction,
  runEndpointActionWith,
} from '../u.endpointAction.ts';
import { DIST_VERIFY_LIMITS } from '../u.staging/u.verifyStagedDist.ts';
import { captureInfo, providerlessPrebuiltStageYaml, withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy endpoint actions', () => {
  describe('stage', () => {
    it('stages providerless prebuilt artifact with deterministic root reset', async () => {
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
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/sample.yaml`;
        await writeSimpleSite(cwd, 'sample');
        await Fs.write(yamlPath, simpleCopyYaml());

        const res = await runEndpointAction({
          cwd,
          key: 'sample',
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

  describe('preview', () => {
    it('delegates only nested serving policy and preserves finite navigation', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/sample.yaml`;
        const until = new AbortController().signal;
        await Fs.write(
          yamlPath,
          Str.dedent(`
            staging:
              dir: ./stage
              serve:
                port: 4319
            mappings: []
          `).trimStart(),
        );

        const calls: t.DistServer.Local.Serve.NestedArgs[] = [];
        const res = await runEndpointActionWith(
          { cwd, key: 'sample', yamlPath, action: 'preview', until },
          {
            serveLocal(input) {
              calls.push(input);
              return Promise.resolve({ kind: 'back' });
            },
          },
        );

        expect(res).to.eql({ ok: true, preview: { kind: 'back' } });
        expect(calls).to.eql([{
          dir: `${cwd}/stage`,
          limits: DIST_VERIFY_LIMITS,
          navigation: 'nested',
          port: 4319,
          name: 'sample',
          until,
        }]);
      });
    });

    it('uses the Deploy preview port default and preserves closed navigation', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/sample.yaml`;
        await Fs.write(
          yamlPath,
          Str.dedent(`
            staging:
              dir: ./stage
            mappings: []
          `).trimStart(),
        );

        let port: t.PortNumber | undefined;
        const res = await runEndpointActionWith(
          { cwd, key: 'sample', yamlPath, action: 'preview' },
          {
            serveLocal(input) {
              port = input.port;
              return Promise.resolve({ kind: 'closed' });
            },
          },
        );

        expect(port).to.eql(DEPLOY_PREVIEW_PORT);
        expect(res).to.eql({ ok: true, preview: { kind: 'closed' } });
      });
    });

    it('reports a sanitized verification reason without generic static fallback', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/sample.yaml`;
        await writeSimpleSite(cwd, 'sample');
        await Fs.write(yamlPath, simpleCopyYaml());
        await Fs.ensureDir(`${cwd}/stage`);

        const { value: res, output } = await captureInfo(() =>
          runEndpointAction({
            cwd,
            key: 'sample',
            yamlPath,
            action: 'preview',
          })
        );

        expect(res.ok).to.eql(false);
        const text = Cli.stripAnsi(output);
        expect(text).to.include('Preview unavailable');
        expect(text).to.include('reason: startup-failure');
        expect(text).to.not.include('Run stage first');
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
  });

  describe('stage-push', () => {
    it('preserves stage success when push is unavailable', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/sample.yaml`;
        await writeSimpleSite(cwd, 'sample');
        await Fs.write(yamlPath, noopCopyYaml());

        const res = await runEndpointAction({
          cwd,
          key: 'sample',
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

/** Helpers: */
async function writePulledComponents(
  cwd: string,
  opts: { includeSw?: boolean } = {},
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
