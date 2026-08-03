import { describe, expect, expectError, Fs, it, Str } from '../../-test.ts';
import type { t } from '../common.ts';
import { Pull } from '../mod.ts';
import { json, release, usingGithubFetch } from '../u.github/-test/u.pull.fixture.ts';

const CONFIG = '-config/@sys.tools.pull/view.yaml';

describe('@sys/tools/pull programmatic execution', () => {
  it('pulls configured bundles from owner YAML', async () => {
    await withDistServer(async (distUrl) => {
      await withTmpDir(async (cwd) => {
        const config = Fs.join(cwd, CONFIG);
        await Fs.write(config, yaml(distUrl), { force: true });

        const result = await Pull.run({ cwd, config: `./${CONFIG}` });

        expect(result.ok).to.eql(true);
        expect(result.config).to.eql(config);
        expect(result.cwd).to.eql(cwd);
        expect(result.dir).to.eql(cwd);
        expect(result.bundles.length).to.eql(1);
        const [bundle] = result.bundles;
        if (!bundle) throw new Error('expected pulled bundle result');
        expect(bundle.bundle.kind).to.eql('http');
        if (bundle.bundle.kind !== 'http' || !('ops' in bundle.data)) {
          throw new Error('expected HTTP bundle result');
        }
        expect(bundle.bundle.local.clear).to.eql(false);
        expect(bundle.data.dist?.pkg?.name).to.eql('@sample/foo');
        expect(await Fs.exists(Fs.join(cwd, 'pulled/sample/dist.json'))).to.eql(true);
      });
    });
  });

  it('routes configured GitHub bundles through the bounded public result model', async () => {
    await withTmpDir(async (cwd) => {
      const canonicalCwd = await Fs.realPath(cwd) as t.StringDir;
      const config = Fs.join(canonicalCwd, CONFIG);
      await Fs.write(config, githubYaml(), { force: true });

      await usingGithubFetch((call) => {
        if (call.url.pathname.endsWith('/releases/latest')) {
          return json(release([{ id: 1, name: 'app.tgz', body: 'app' }]));
        }
        if (call.url.pathname.endsWith('/releases/assets/1')) return new Response('app');
        return new Response('not found', { status: 404 });
      }, async () => {
        const result = await Pull.run({ cwd: canonicalCwd, config: `./${CONFIG}` });
        const [pulled] = result.bundles;
        if (!pulled || pulled.bundle.kind !== 'github:release' || !('files' in pulled.data)) {
          throw new Error('expected GitHub release result');
        }
        expect(pulled.data.files.map((file) => file.target)).to.eql(['app.tgz']);
        expect(await Fs.exists(Fs.join(canonicalCwd, 'pulled/release/app.tgz'))).to.eql(true);
        expect(await Fs.exists(Fs.join(canonicalCwd, 'pulled/release/dist.json'))).to.eql(false);
      });
    });
  });

  it('returns an empty result when no bundles are configured', async () => {
    await withTmpDir(async (cwd) => {
      const config = Fs.join(cwd, CONFIG);
      await Fs.write(config, 'dir: .\n', { force: true });

      const result = await Pull.run({ cwd, config: `./${CONFIG}` });

      expect(result.ok).to.eql(true);
      expect(result.bundles).to.eql([]);
    });
  });

  it('accepts owner config refs from paths.config', async () => {
    await withTmpDir(async (cwd) => {
      const config = Fs.join(cwd, CONFIG);
      await Fs.write(config, 'dir: .\n', { force: true });

      const result = await Pull.run({ cwd, paths: { config: `./${CONFIG}` } });

      expect(result.ok).to.eql(true);
      expect(result.config).to.eql(config);
      expect(result.bundles).to.eql([]);
    });
  });

  it('accepts equivalent config refs', async () => {
    await withTmpDir(async (cwd) => {
      const config = Fs.join(cwd, CONFIG);
      await Fs.write(config, 'dir: .\n', { force: true });

      const result = await Pull.run({ cwd, config: `./${CONFIG}`, paths: { config } });

      expect(result.ok).to.eql(true);
      expect(result.config).to.eql(config);
    });
  });

  it('rejects conflicting config refs', async () => {
    await withTmpDir(async (cwd) => {
      await expectError(
        () =>
          Pull.run({
            cwd,
            config: './a.yaml',
            paths: { config: './b.yaml' },
          }),
        'Pull.run: config and paths.config resolve to different paths.',
      );
    });
  });

  it('fails clearly when the config cannot load', async () => {
    await withTmpDir(async (cwd) => {
      await expectError(
        () => Pull.run({ cwd, config: './missing.yaml' }),
        'Pull.run: failed to load config:',
      );
    });
  });
});

function githubYaml() {
  return Str.dedent(`
    dir: .
    bundles:
      - kind: github:release
        repo: owner/repo
        local:
          dir: pulled/release
          mode: create
        limits:
          metadataBytes: 100000
          entries: 10
          fileBytes: 100000
          totalBytes: 100000
          totalTime: 5000
  `).trimStart();
}

function yaml(distUrl: t.StringUrl) {
  return Str.dedent(`
    dir: .
    bundles:
      - kind: http
        dist: ${distUrl}
        local:
          dir: pulled/sample
  `).trimStart();
}

async function withTmpDir(fn: (dir: t.StringDir) => Promise<void>) {
  const dir = await Fs.makeTempDir({ prefix: 'sys.tools.pull.run.' });
  try {
    await fn(dir.absolute as t.StringDir);
  } finally {
    await Fs.remove(dir.absolute);
  }
}

async function withDistServer(fn: (distUrl: t.StringUrl) => Promise<void>) {
  const abort = new AbortController();
  const server = Deno.serve({ port: 0, signal: abort.signal }, () => {
    return Response.json(distFixture());
  });

  try {
    const { port } = server.addr;
    await fn(`http://127.0.0.1:${port}/dist.json` as t.StringUrl);
  } finally {
    abort.abort();
    await server.finished.catch(() => undefined);
  }
}

function distFixture(): t.DistPkg {
  return {
    type: 'https://jsr.io/@sample/foo',
    pkg: { name: '@sample/foo', version: '1.0.0' },
    build: {
      time: Date.now(),
      size: { total: 1234, pkg: 1234 },
      builder: '@sample/builder@1.0.0',
      runtime: 'deno=2.6.0:v8=14.5.201.2-rusty:typescript=5.9.2',
      hash: { policy: 'https://jsr.io/@sys/fs/0.0.229/src/m.Pkg/m.Pkg.Dist.ts' },
    },
    hash: {
      digest: 'sha256-237bf73369464342ecde735fc719e09b2e61d72f796101890cdcee7efcd1bb18',
      parts: {},
    },
  };
}
