import { describe, expect, Fs, Is, it, Path, Pkg, Str, type t } from '../../-test.ts';
import { Deploy } from '../mod.ts';
import { pushEndpoint } from '../u.push/mod.ts';
import { R2Provider } from '../u.providers/mod.ts';
import { captureInfo, withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy programmatic push: r2', () => {
  it('pushEndpoint(...) returns no-staging-output when r2 staging is absent', async () => {
    await withTmpDir(async (cwd) => {
      const config = `${cwd}/deploy.r2.yaml`;
      await Fs.ensureDir(`${cwd}/src/site`);
      await Fs.write(`${cwd}/src/site/index.html`, '<!doctype html><html>site</html>\n');
      await Fs.write(config, r2Yaml({ staging: './stage' }));

      const originalPush = R2Provider.push;
      const r2 = R2Provider as { push: typeof R2Provider.push };
      let pushCalls = 0;

      try {
        r2.push = async () => {
          pushCalls += 1;
          return { ok: true };
        };

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
      } finally {
        r2.push = originalPush;
      }
    });
  });

  it('Deploy.push(...) pushes resolved r2 target without presentation output', async () => {
    await withTmpDir(async (cwd) => {
      const config = `${cwd}/deploy.r2.yaml`;
      const staging = Path.resolve(cwd, './stage');
      await Fs.ensureDir(`${cwd}/src/site`);
      await Fs.write(`${cwd}/src/site/index.html`, '<!doctype html><html>source</html>\n');
      await Fs.ensureDir(staging);
      await Fs.write(`${staging}/index.html`, '<!doctype html><html>staged</html>\n');
      await Pkg.Dist.compute({ dir: staging, save: true });
      await Fs.write(config, r2Yaml({ staging: './stage' }));

      const originalPush = R2Provider.push;
      const r2 = R2Provider as { push: typeof R2Provider.push };
      let pushed: t.R2PushTarget | undefined;

      try {
        r2.push = async (args) => {
          pushed = args.target;
          return { ok: true };
        };

        const captured = await captureInfo(() => Deploy.push({ cwd, config: './deploy.r2.yaml' }));
        const result = captured.value;

        expect(captured.output).to.eql('');
        expect(result.ok).to.eql(true);
        expect(result.cwd).to.eql(cwd);
        expect(result.config).to.eql(config);
        expect(result.targets).to.eql(1);
        expect(Is.num(result.bytes)).to.eql(true);
        expect(pushed?.stagingDir).to.eql(staging);
        expect(pushed?.provider.kind).to.eql('r2');
        expect(pushed?.provider.prefix).to.eql('deploy/site');
      } finally {
        r2.push = originalPush;
      }
    });
  });
});

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
