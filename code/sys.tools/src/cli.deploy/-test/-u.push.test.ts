import { describe, expect, Fs, Is, it, Path, Pkg, Str, type t } from '../../-test.ts';
import { Deploy } from '../mod.ts';
import { pushEndpoint } from '../u.push/mod.ts';
import { OrbiterProvider, Provider } from '../u.providers/mod.ts';
import { captureInfo, providerlessPrebuiltStageYaml, withTmpDir } from './-fixtures.ts';

describe('@sys/tools/deploy programmatic push', () => {
  it('Deploy.push(...) rejects providerless endpoints clearly', async () => {
    await withTmpDir(async (cwd) => {
      const config = `${cwd}/-config/@sys.tools.deploy/stage.yaml`;
      await Fs.ensureDir(`${cwd}/view/.pulled/ui.components`);
      await Fs.write(
        `${cwd}/view/.pulled/ui.components/index.html`,
        '<!doctype html><html><body>source</body></html>\n',
      );
      await Fs.write(config, providerlessPrebuiltStageYaml());

      let error: unknown;
      const captured = await captureInfo(async () => {
        try {
          await Deploy.push({ cwd, config: './-config/@sys.tools.deploy/stage.yaml' });
        } catch (err) {
          error = err;
        }
      });

      expect(captured.output).to.eql('');
      expect(String(error)).to.include('Deploy.push: failed to push config');
      expect(String(error)).to.include('reason: no-provider');
      expect(String(error)).to.include('No provider configured for this endpoint.');
    });
  });

  it('pushEndpoint(...) returns no-staging-output when orbiter staging is absent', async () => {
    await withTmpDir(async (cwd) => {
      const config = `${cwd}/deploy.yaml`;
      await Fs.ensureDir(`${cwd}/src/site`);
      await Fs.write(`${cwd}/src/site/index.html`, '<!doctype html><html>site</html>\n');
      await Fs.write(config, orbiterYaml({ staging: './stage' }));

      const captured = await captureInfo(() => pushEndpoint({ cwd, config }));
      const result = captured.value;

      expect(captured.output).to.eql('');
      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected push failure');
      expect(result.reason).to.eql('no-staging-output');
      expect(result.hint).to.eql('Run staging first (no staging output found).');
    });
  });

  it('pushEndpoint(...) resolves env refs from caller cwd before target resolution', async () => {
    await withTmpDir(async (cwd) => {
      const config = `${cwd}/deploy.env.yaml`;
      await Fs.ensureDir(`${cwd}/src/env-site`);
      await Fs.write(`${cwd}/src/env-site/index.html`, '<!doctype html><html>env</html>\n');
      await Fs.write(
        `${cwd}/.env`,
        'DEPLOY_SOURCE="./src"\nDEPLOY_MAPPING="./env-site"\nDEPLOY_STAGING="./stage-from-env"\n',
      );
      await Fs.write(
        config,
        orbiterYaml({
          source: '${env:DEPLOY_SOURCE}',
          mappingSource: '${env:DEPLOY_MAPPING}',
          staging: '${env:DEPLOY_STAGING}',
        }),
      );

      const result = await pushEndpoint({ cwd, config });

      expect(result.ok).to.eql(false);
      if (result.ok) throw new Error('expected push failure');
      expect(result.reason).to.eql('no-staging-output');
    });
  });

  it('Deploy.push(...) pushes resolved orbiter targets without presentation output', async () => {
    await withTmpDir(async (cwd) => {
      const config = `${cwd}/deploy.yaml`;
      const staging = Path.resolve(cwd, './stage');
      await Fs.ensureDir(`${cwd}/src/site`);
      await Fs.write(`${cwd}/src/site/index.html`, '<!doctype html><html>source</html>\n');
      await Fs.ensureDir(staging);
      await Fs.write(`${staging}/index.html`, '<!doctype html><html>staged</html>\n');
      await Pkg.Dist.compute({ dir: staging, save: true });
      await Fs.write(config, orbiterYaml({ staging: './stage' }));

      const originalProbe = Provider.probe;
      const originalPush = OrbiterProvider.push;
      const provider = Provider as { probe: typeof Provider.probe };
      const orbiter = OrbiterProvider as { push: typeof OrbiterProvider.push };
      let pushed: t.OrbiterPushTarget | undefined;

      try {
        provider.probe = async () => ({ ok: true });
        orbiter.push = async (args) => {
          pushed = args.target;
          return { ok: true };
        };

        const captured = await captureInfo(() => Deploy.push({ cwd, config: './deploy.yaml' }));
        const result = captured.value;

        expect(captured.output).to.eql('');
        expect(result.ok).to.eql(true);
        expect(result.cwd).to.eql(cwd);
        expect(result.config).to.eql(config);
        expect(result.targets).to.eql(1);
        expect(Is.num(result.bytes)).to.eql(true);
        expect(pushed?.stagingDir).to.eql(staging);
      } finally {
        provider.probe = originalProbe;
        orbiter.push = originalPush;
      }
    });
  });
});

function orbiterYaml(opts: {
  source?: string;
  mappingSource?: string;
  staging: string;
}): string {
  const source = opts.source ?? './src';
  const mappingSource = opts.mappingSource ?? './site';

  return Str.dedent(`
    provider:
      kind: orbiter
      siteId: site-1
      domain: example.com
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
