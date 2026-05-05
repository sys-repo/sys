import { describe, expect, it, Fs, Str } from '../../../-test.ts';
import { type t } from '../../common.ts';
import { executeBundlePull } from '../u.bundle.ts';

describe('cli.pull/u.bundle → config stability', () => {
  it('successful pull does not write recency metadata into source config', async () => {
    await withDistServer(async (distUrl) => {
      await withTmpDir(async (baseDir) => {
        const yamlPath = Fs.join(baseDir, 'pull.yaml');
        const yaml = Str.dedent(`
        dir: .
        bundles:
          - kind: http
            dist: ${distUrl}
            local:
              dir: pulled/sample
        `).trimStart();
        await Fs.write(yamlPath, yaml, { force: true });

        const bundle: t.PullTool.ConfigYaml.HttpBundle = {
          kind: 'http',
          dist: distUrl,
          local: { dir: 'pulled/sample' as t.StringRelativeDir },
        };
        const location: t.PullTool.ConfigYaml.Location = {
          dir: baseDir,
          bundles: [bundle],
        };

        const result = await executeBundlePull(yamlPath, location, bundle);
        expect(result.ok).to.eql(true);

        const after = await Fs.readText(yamlPath);
        expect(after.data).to.eql(yaml);
      });
    });
  });
});

async function withTmpDir(fn: (dir: t.StringDir) => Promise<void>) {
  const dir = await Fs.makeTempDir({ prefix: 'sys.tools.pull.bundle.config.' });
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
