import { describe, expect, Fs, Is, it, Path, Pkg, Str, type t } from '../../-test.ts';
import { Deploy } from '../mod.ts';
import { pushEndpoint } from '../u.push/mod.ts';
import { R2Provider } from '../u.providers/mod.ts';
import { captureInfo, withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy programmatic push: r2', () => {
  describe('pushEndpoint', () => {
    it('returns no-staging-output without mutating provider when staging is absent', async () => {
      await withTmpDir(async (cwd) => {
        const config = `${cwd}/deploy.r2.yaml`;
        await writeSourceSite(cwd, 'site');
        await Fs.write(config, r2Yaml({ staging: './stage' }));

        let pushCalls = 0;
        await withMockedR2Push(
          async () => {
            pushCalls += 1;
            return { ok: true };
          },
          async () => {
            const captured = await captureInfo(() => pushEndpoint({ cwd, config }));
            const result = captured.value;

            expect(captured.output).to.eql('');
            expect(pushCalls).to.eql(0);
            expect(result.ok).to.eql(false);
            if (result.ok) throw new Error('expected push failure');
            expect(result.reason).to.eql('no-staging-output');
            expect(result.hint).to.eql('Run staging first (no staging output found).');
            expect(result.missing?.[0]?.provider).to.eql('r2');
            expect(result.missing?.[0]?.bucket).to.eql('deploy-bucket');
            expect(result.missing?.[0]?.prefix).to.eql('deploy/site');
          },
        );
      });
    });
  });

  describe('Deploy.push', () => {
    it('pushes the resolved r2 target and returns provider publish file details without presentation output', async () => {
      await withTmpDir(async (cwd) => {
        const config = `${cwd}/deploy.r2.yaml`;
        const staging = Path.resolve(cwd, './stage');
        await writeSourceSite(cwd, 'source');
        await writeStagedSite(staging, 'staged');
        await Fs.write(config, r2Yaml({ staging: './stage' }));

        let pushed: t.R2PushTarget | undefined;
        let seenForce: boolean | undefined;
        await withMockedR2Push(
          async (args) => {
            pushed = args.target;
            seenForce = args.force;
            return {
              ok: true,
              publish: {
                files: [
                  { path: 'asset.bin', status: 'written' },
                  { path: 'index.html', status: 'skipped' },
                  { path: 'dist.json', status: 'written' },
                ],
              },
              prune: { files: [{ path: 'old.js', status: 'removed' }] },
            };
          },
          async () => {
            const captured = await captureInfo(() =>
              Deploy.push({ cwd, config: './deploy.r2.yaml' })
            );
            const result = captured.value;

            expect(captured.output).to.eql('');
            expect(result.ok).to.eql(true);
            expect(result.cwd).to.eql(cwd);
            expect(result.config).to.eql(config);
            expect(result.targets).to.eql(1);
            expect(Is.num(result.bytes)).to.eql(true);
            expect(publishFileStatuses(result.publish)).to.eql([
              { path: 'asset.bin', status: 'written' },
              { path: 'index.html', status: 'skipped' },
              { path: 'dist.json', status: 'written' },
            ]);
            expect(pruneFileStatuses(result.prune)).to.eql([{ path: 'old.js', status: 'removed' }]);
            expect(pushed?.stagingDir).to.eql(staging);
            expect(pushed?.provider.kind).to.eql('r2');
            expect(pushed?.provider.prefix).to.eql('deploy/site');
            expect(seenForce).to.eql(undefined);
          },
        );
      });
    });

    it('passes force into the r2 provider push', async () => {
      await withTmpDir(async (cwd) => {
        const config = `${cwd}/deploy.r2.yaml`;
        const staging = Path.resolve(cwd, './stage');
        await writeSourceSite(cwd, 'source');
        await writeStagedSite(staging, 'staged');
        await Fs.write(config, r2Yaml({ staging: './stage' }));
        let seenForce: boolean | undefined;

        await withMockedR2Push(
          async (args) => {
            seenForce = args.force;
            return { ok: true };
          },
          async () => {
            const result = await Deploy.push({ cwd, config: './deploy.r2.yaml', force: true });

            expect(result.ok).to.eql(true);
            expect(seenForce).to.eql(true);
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

async function writeSourceSite(cwd: string, body: string): Promise<void> {
  await Fs.ensureDir(`${cwd}/src/site`);
  await Fs.write(`${cwd}/src/site/index.html`, `<!doctype html><html>${body}</html>\n`);
}

async function writeStagedSite(staging: string, body: string): Promise<void> {
  await Fs.ensureDir(staging);
  await Fs.write(`${staging}/index.html`, `<!doctype html><html>${body}</html>\n`);
  await Pkg.Dist.compute({ dir: staging, save: true });
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

function r2Yaml(opts: {
  source?: string;
  mappingSource?: string;
  staging: string;
}): string {
  const source = opts.source ?? './src';
  const mappingSource = opts.mappingSource ?? './site';

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
      dir: ${source}
    staging:
      dir: ${opts.staging}
    mappings:
      - mode: copy
        dir:
          source: ${mappingSource}
          staging: .
  `).trimStart();
}
