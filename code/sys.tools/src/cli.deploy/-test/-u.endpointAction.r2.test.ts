import { Cli, describe, expect, Fs, it, Pkg, Str } from '../../-test.ts';
import { runEndpointAction } from '../u.endpointAction.ts';
import { R2Provider } from '../u.providers/mod.ts';
import { captureInfo, withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy endpoint actions: r2', () => {
  describe('push', () => {
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

    it('reports provider prune stats as stale-file cleanup', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/r2.yaml`;
        await writeSimpleSite(cwd, 'source');
        await writeStagedSite(cwd, 'staged');
        await Fs.write(yamlPath, r2CopyYaml());

        await withMockedR2Push(
          async () => ({
            ok: true,
            prune: { files: [{ path: 'old.js', status: 'removed' }] },
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
            expect(pruneFileStatuses(res.push?.prune)).to.eql([
              { path: 'old.js', status: 'removed' },
            ]);

            const text = Cli.stripAnsi(output);
            expect(text).to.include('removed');
            expect(text).to.include('1   stale files');
          },
        );
      });
    });

    it('passes force into provider push and labels uploaded files as forced', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/r2.yaml`;
        await writeSimpleSite(cwd, 'source');
        await writeStagedSite(cwd, 'staged');
        await Fs.write(yamlPath, r2CopyYaml());
        let seenForce: boolean | undefined;

        await withMockedR2Push(
          async (args) => {
            seenForce = args.force;
            return {
              ok: true,
              publish: {
                files: [
                  { path: 'asset.bin', status: 'written' },
                  { path: 'index.html', status: 'written' },
                  { path: 'dist.json', status: 'written' },
                ],
              },
            };
          },
          async () => {
            const { value: res, output } = await captureInfo(() =>
              runEndpointAction({
                cwd,
                key: 'r2',
                yamlPath,
                action: 'push',
                force: true,
              })
            );

            expect(res.ok).to.eql(true);
            expect(seenForce).to.eql(true);
            const text = Cli.stripAnsi(output);
            expect(text).to.include('uploaded');
            expect(text).to.include('3   forced files');
          },
        );
      });
    });
  });

  describe('stage-push', () => {
    it('carries force into the push half after staging succeeds', async () => {
      await withTmpDir(async (cwd) => {
        const yamlPath = `${cwd}/-config/@sys.tools.deploy/r2.yaml`;
        await writeSimpleSite(cwd, 'source');
        await Fs.write(yamlPath, r2CopyYaml());
        let seenForce: boolean | undefined;

        await withMockedR2Push(
          async (args) => {
            seenForce = args.force;
            return { ok: true };
          },
          async () => {
            const { value: res } = await captureInfo(() =>
              runEndpointAction({
                cwd,
                key: 'r2',
                yamlPath,
                action: 'stage-push',
                force: true,
              })
            );

            expect(res.ok).to.eql(true);
            expect(res.stageOk).to.eql(true);
            expect(res.push?.ok).to.eql(true);
            expect(seenForce).to.eql(true);
            expect(await Fs.exists(`${cwd}/stage/dist.json`)).to.eql(true);
          },
        );
      });
    });
  });
});

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

async function writeSimpleSite(cwd: string, body: string): Promise<void> {
  await Fs.ensureDir(`${cwd}/src/site`);
  await Fs.write(`${cwd}/src/site/index.html`, `<!doctype html><html>${body}</html>\n`);
}

async function writeStagedSite(cwd: string, body: string): Promise<void> {
  await Fs.ensureDir(`${cwd}/stage`);
  await Fs.write(`${cwd}/stage/index.html`, `<!doctype html><html>${body}</html>\n`);
  await Pkg.Dist.compute({ dir: `${cwd}/stage`, save: true });
}

function publishFileStatuses(
  publish?: { readonly files?: readonly { readonly path: string; readonly status: string }[] },
): readonly { readonly path: string; readonly status: string }[] {
  return (publish?.files ?? []).map((file) => ({ path: file.path, status: file.status }));
}

function pruneFileStatuses(
  prune?: { readonly files?: readonly { readonly path: string; readonly status: string }[] },
): readonly { readonly path: string; readonly status: string }[] {
  return (prune?.files ?? []).map((file) => ({ path: file.path, status: file.status }));
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
