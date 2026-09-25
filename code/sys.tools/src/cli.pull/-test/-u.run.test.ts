import { describe, expect, expectError, Fs, it, Str } from '../../-test.ts';
import type { t } from '../common.ts';
import { Pull } from '../mod.ts';
import { removeDistStore, usingDistServer } from '../u.bundle/-test/u.dist.fixture.ts';
import { json, release, usingGithubFetch } from '../u.github/-test/u.pull.fixture.ts';

const CONFIG = '-config/@sys.tools.pull/view.yaml';
const INDEX = '<html><head><base href="https://example.com/" /></head><body>fixture</body></html>';

describe('@sys/tools/pull programmatic execution', () => {
  it('materializes a pinned generation and isolates mutable projection rewrites', async () => {
    await usingDistServer(async (fixture) => {
      await withTmpDir(async (cwd) => {
        const config = Fs.join(cwd, CONFIG);
        await Fs.write(config, distYaml(fixture), { force: true });

        const result = await Pull.run({ cwd, config: `./${CONFIG}` });
        const [pulled] = result.bundles;
        if (!pulled || pulled.bundle.kind !== 'dist' || !('kind' in pulled.data)) {
          throw new Error('expected Dist bundle result');
        }

        expect(pulled.data.kind).to.eql('dist');
        expect(pulled.data.generation.kind).to.eql('promoted');
        expect(pulled.data.generation.integrity).to.eql(fixture.integrity);
        expect(pulled.data.generation.verification.dist.pkg?.name).to.eql('@sample/foo');
        expect(pulled.data.projection.kind).to.eql('projected');

        const generationIndex = await Fs.readText(
          Fs.join(pulled.data.generation.dir, 'index.html'),
        );
        const projectedIndex = await Fs.readText(Fs.join(cwd, 'pulled/sample/index.html'));
        expect(generationIndex.data).to.eql(INDEX);
        expect(projectedIndex.data).to.include('<base href="/pulled/sample/" />');
        expect(projectedIndex.data).to.not.eql(generationIndex.data);

        const generationAsset = Fs.join(pulled.data.generation.dir, 'asset.txt');
        const projectedAsset = Fs.join(cwd, 'pulled/sample/asset.txt');
        const generationMode = (await Deno.lstat(generationAsset)).mode;
        const projectionMode = (await Deno.lstat(projectedAsset)).mode;
        if (generationMode !== null && projectionMode !== null) {
          expect(generationMode & 0o222).to.eql(0);
          expect(projectionMode & 0o600).to.eql(0o600);
        }

        await Fs.write(projectedAsset, 'mutated projection', { force: true });
        expect((await Fs.readText(projectedAsset)).data).to.eql('mutated projection');
        expect((await Fs.readText(generationAsset)).data).to.eql('fixture-asset');
        expect((await Deno.lstat(generationAsset)).mode).to.eql(generationMode);
      });
    }, { indexHtml: INDEX });
  });

  it('treats existing and promoted generations identically without refetching', async () => {
    await usingDistServer(async (fixture) => {
      await withTmpDir(async (cwd) => {
        const config = Fs.join(cwd, CONFIG);
        await Fs.write(config, distYaml(fixture), { force: true });

        const first = await Pull.run({ cwd, config: `./${CONFIG}` });
        const afterFirst = fixture.requests();
        const second = await Pull.run({ cwd, config: `./${CONFIG}` });
        const a = first.bundles[0];
        const b = second.bundles[0];
        if (
          !a ||
          !b ||
          a.bundle.kind !== 'dist' ||
          b.bundle.kind !== 'dist' ||
          !('kind' in a.data) ||
          !('kind' in b.data)
        ) {
          throw new Error('expected Dist bundle results');
        }

        expect(a.data.generation.kind).to.eql('promoted');
        expect(b.data.generation.kind).to.eql('existing');
        expect(b.data.generation.dir).to.eql(a.data.generation.dir);
        expect(b.data.projection.kind).to.eql('projected');
        expect(fixture.requests()).to.eql(afterFirst);
      });
    }, { indexHtml: INDEX });
  });

  it('materializes without creating a mutable projection when none is configured', async () => {
    await usingDistServer(async (fixture) => {
      await withTmpDir(async (cwd) => {
        const config = Fs.join(cwd, CONFIG);
        await Fs.write(config, distYaml(fixture, false), { force: true });

        const result = await Pull.run({ cwd, config: `./${CONFIG}` });
        const pulled = result.bundles[0];
        if (!pulled || pulled.bundle.kind !== 'dist' || !('kind' in pulled.data)) {
          throw new Error('expected Dist bundle result');
        }

        expect(pulled.data.projection).to.eql({ kind: 'not-requested' });
        expect(await Fs.exists(Fs.join(cwd, 'pulled/sample'))).to.eql(false);
        expect(await Fs.exists(pulled.data.generation.dir)).to.eql(true);
      });
    });
  });

  it('does not project when pinned materialization fails', async () => {
    await usingDistServer(async (fixture) => {
      await withTmpDir(async (cwd) => {
        const config = Fs.join(cwd, CONFIG);
        const wrong = { ...fixture, integrity: `sha256-${'f'.repeat(64)}` as t.StringHash };
        await Fs.write(config, distYaml(wrong), { force: true });

        await expectError(
          () => Pull.run({ cwd, config: `./${CONFIG}` }),
          'Dist materialization failed: manifest-fetch/integrity-mismatch',
        );
        expect(await Fs.exists(Fs.join(cwd, 'pulled/sample'))).to.eql(false);
      });
    });
  });

  it('propagates cancellation without projecting mutable bytes', async () => {
    await usingDistServer(async (fixture) => {
      await withTmpDir(async (cwd) => {
        const config = Fs.join(cwd, CONFIG);
        await Fs.write(config, distYaml(fixture), { force: true });
        const controller = new AbortController();
        controller.abort('test cancellation');

        await expectError(
          () => Pull.run({ cwd, config: `./${CONFIG}`, until: controller.signal }),
          'cancelled',
        );
        expect(await Fs.exists(Fs.join(cwd, 'pulled/sample'))).to.eql(false);
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

  it('accepts equivalent owner config refs and rejects conflicting refs', async () => {
    await withTmpDir(async (cwd) => {
      const config = Fs.join(cwd, CONFIG);
      await Fs.write(config, 'dir: .\n', { force: true });

      const result = await Pull.run({ cwd, config: `./${CONFIG}`, paths: { config } });
      expect(result.config).to.eql(config);

      await expectError(
        () => Pull.run({ cwd, config: './a.yaml', paths: { config: './b.yaml' } }),
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

function distYaml(
  fixture: { readonly manifest: t.StringUrl; readonly integrity: t.StringHash },
  project = true,
) {
  if (!project) {
    return Str.dedent(`
      dir: .
      bundles:
        - kind: dist
          manifest: ${fixture.manifest}
          integrity: ${fixture.integrity}
          store: ./.dist-store
    `).trimStart();
  }

  return Str.dedent(`
    dir: .
    bundles:
      - kind: dist
        manifest: ${fixture.manifest}
        integrity: ${fixture.integrity}
        store: ./.dist-store
        project:
          dir: pulled/sample
          mode: replace
  `).trimStart();
}

async function withTmpDir(fn: (dir: t.StringDir) => Promise<void>) {
  const dir = await Fs.makeTempDir({ prefix: 'sys.tools.pull.run.' });
  const failures: unknown[] = [];
  try {
    await fn(dir.absolute as t.StringDir);
  } catch (cause) {
    failures.push(cause);
  }

  let storeRemoved = false;
  try {
    await removeDistStore(dir.absolute as t.StringDir);
    storeRemoved = true;
  } catch (cause) {
    failures.push(cause);
  }
  if (storeRemoved) {
    try {
      await Fs.remove(dir.absolute);
    } catch (cause) {
      failures.push(cause);
    }
  }

  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) {
    throw new AggregateError(failures, '@sys/tools Pull fixture cleanup failed.');
  }
}
