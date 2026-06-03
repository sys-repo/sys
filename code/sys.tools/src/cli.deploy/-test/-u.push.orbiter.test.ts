import { describe, expect, Fs, Is, it, Path, Pkg, Str, type t } from '../../-test.ts';
import { Deploy } from '../mod.ts';
import { pushEndpoint } from '../u.push/mod.ts';
import { OrbiterProvider, Provider } from '../u.providers/mod.ts';
import { captureInfo, withTmpDir } from './u.fixture.ts';

describe('@sys/tools/deploy programmatic push: orbiter', () => {
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

  it('pushEndpoint(...) returns no-staging-output when staging dir lacks dist metadata', async () => {
    await withTmpDir(async (cwd) => {
      const config = `${cwd}/deploy.yaml`;
      await Fs.ensureDir(`${cwd}/src/site`);
      await Fs.write(`${cwd}/src/site/index.html`, '<!doctype html><html>site</html>\n');
      await Fs.ensureDir(`${cwd}/stage`);
      await Fs.write(`${cwd}/stage/index.html`, '<!doctype html><html>unstaged</html>\n');
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

  it('pushEndpoint(...) refuses incomplete shard plans before provider mutation', async () => {
    await withTmpDir(async (cwd) => {
      const config = `${cwd}/deploy.shards.yaml`;
      const shard0 = Path.resolve(cwd, './stage/shard.0');
      const shard1 = Path.resolve(cwd, './stage/shard.1');
      await Fs.ensureDir(`${cwd}/src/site-0`);
      await Fs.write(`${cwd}/src/site-0/index.html`, '<!doctype html><html>shard 0</html>\n');
      await Fs.ensureDir(shard0);
      await Fs.write(`${shard0}/index.html`, '<!doctype html><html>staged shard 0</html>\n');
      await Pkg.Dist.compute({ dir: shard0, save: true });
      await Fs.write(config, orbiterShardedYaml());

      const originalProbe = Provider.probe;
      const originalPush = OrbiterProvider.push;
      const provider = Provider as { probe: typeof Provider.probe };
      const orbiter = OrbiterProvider as { push: typeof OrbiterProvider.push };
      let pushCalls = 0;

      try {
        provider.probe = async () => ({ ok: true });
        orbiter.push = async () => {
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
        expect(result.missing?.length).to.eql(1);
        expect(result.missing?.[0]?.reason).to.eql('missing-staging-output');
        expect(result.missing?.[0]?.shard).to.eql(1);
        expect(result.missing?.[0]?.stagingDir).to.eql(shard1);
      } finally {
        provider.probe = originalProbe;
        orbiter.push = originalPush;
      }
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

  it('pushEndpoint(...) includes target context when provider push fails', async () => {
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

      try {
        provider.probe = async () => ({ ok: true });
        orbiter.push = async () => ({ ok: false, reason: 'failed', hint: 'orbiter down' });

        const result = await pushEndpoint({ cwd, config });

        expect(result.ok).to.eql(false);
        if (result.ok) throw new Error('expected push failure');
        expect(result.reason).to.eql('failed');
        expect(result.hint).to.eql('orbiter down');
        expect(result.target?.index).to.eql(0);
        expect(result.target?.provider).to.eql('orbiter');
        expect(result.target?.siteId).to.eql('site-1');
        expect(result.target?.domain).to.eql('example.com');
        expect(result.target?.stagingDir).to.eql(staging);
      } finally {
        provider.probe = originalProbe;
        orbiter.push = originalPush;
      }
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

function orbiterShardedYaml(): string {
  return Str.dedent(`
    provider:
      kind: orbiter
      siteId: base-site
      domain: example.com
      shards:
        total: 2
        siteIds:
          0: site-0
          1: site-1
    source:
      dir: ./src
    staging:
      dir: ./stage
    mappings:
      - mode: copy
        dir:
          source: ./site-<shard>
          staging: ./shard.<shard>
  `).trimStart();
}

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
