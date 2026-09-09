import { withTmpDir } from '../../-test/u.fixture.ts';
import {
  Cli,
  describe,
  expect,
  expectError,
  Fs,
  it,
  Json,
  Path,
  Pkg,
  Str,
  type t,
  Time,
} from '../../../-test.ts';
import { combineStagingLeases } from '../u.buildLease.ts';
import { finalizeDistTree } from '../u.finalizeDistTree.ts';
import { captureDirectoryIdentity } from '../u.identity.ts';
import { settleStagingLease } from '../u.lease.ts';
import { stageMappings } from '../u.stageMappings.ts';
import { DIST_VERIFY_LIMITS, verifyStagedDist } from '../u.verifyStagedDist.ts';

const copy = (source: string, staging: string): t.DeployTool.Staging.Mapping => ({
  mode: 'copy',
  dir: { source, staging },
});

describe('Staging: owned exact root Dist', () => {
  it('resets the root, removes only temporary manifests, and returns strict evidence', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/site/assets`);
      await Fs.write(`${tmp}/src/site/app.js`, 'app');
      await Fs.write(`${tmp}/src/site/assets/logo.svg`, '<svg/>');
      await Fs.write(`${tmp}/src/site/assets/dist.json`, '{malformed');
      await Fs.ensureDir(`${tmp}/src/docs`);
      await Fs.write(`${tmp}/src/docs/readme.txt`, 'docs');

      await Fs.ensureDir(`${tmp}/stage/stale`);
      await Fs.write(`${tmp}/stage/stale/old.txt`, 'stale');
      await Fs.write(`${tmp}/outside.txt`, 'outside');

      const result = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('src/site', 'site'), copy('src/docs', 'docs')],
      });

      expect(result.stagingRoot).to.eql(`${tmp}/stage`);
      expect(Object.isFrozen(result)).to.eql(true);
      expect(Object.isFrozen(result.verification)).to.eql(true);
      expect(Object.isFrozen(result.verification.dist)).to.eql(true);
      expect(Object.isFrozen(result.verification.dist.hash.parts)).to.eql(true);
      expect(result.verification.integrity).to.not.eql(result.verification.dist.hash.digest);
      expect(await Fs.exists(`${tmp}/stage/stale/old.txt`)).to.eql(false);
      expect((await Fs.readText(`${tmp}/outside.txt`)).data).to.eql('outside');

      const actual = await regularFiles(`${tmp}/stage`);
      const declared = Object.keys(result.verification.dist.hash.parts).toSorted();
      expect(actual).to.eql([...declared, 'dist.json'].toSorted());
      expect(actual.filter((path) => path.endsWith('/dist.json'))).to.eql([]);

      const rootIndex = (await Fs.readText(`${tmp}/stage/index.html`)).data ?? '';
      const childIndex = (await Fs.readText(`${tmp}/stage/site/index.html`)).data ?? '';
      expect(rootIndex).to.include('href="./site/index.html"');
      expect(rootIndex).to.include('href="./dist.json"');
      expect(childIndex).to.include('href="./assets/index.html"');
      expect(childIndex.includes('href="./dist.json"')).to.eql(false);
    });
  });

  it('rebuilds schedule-independent asset content and preserves custom index bytes', async () => {
    await withTmpDir(async (tmp) => {
      const custom = '<!doctype html><html><body>custom</body></html>\n';
      await Fs.ensureDir(`${tmp}/src/custom`);
      await Fs.write(`${tmp}/src/custom/index.html`, custom);
      await Fs.write(`${tmp}/src/custom/a.txt`, 'a');
      await Fs.ensureDir(`${tmp}/src/empty`);
      await Fs.write(`${tmp}/src/empty/index.html`, '');

      const args = {
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('src/custom', 'custom'), copy('src/empty', 'empty')],
      };
      const first = await stageMappings(args);
      const firstRootIndex = (await Fs.readText(`${tmp}/stage/index.html`)).data;

      await Fs.write(`${tmp}/stage/stale.txt`, 'stale');
      const second = await stageMappings(args);
      const secondRootIndex = (await Fs.readText(`${tmp}/stage/index.html`)).data;

      expect(first.verification.dist.hash.digest).to.eql(second.verification.dist.hash.digest);
      expect(firstRootIndex).to.eql(secondRootIndex);
      expect((await Fs.readText(`${tmp}/stage/custom/index.html`)).data).to.eql(custom);
      expect((await Fs.readText(`${tmp}/stage/empty/index.html`)).data).to.eql('');
      expect(await Fs.exists(`${tmp}/stage/stale.txt`)).to.eql(false);
    });
  });

  it('fails closed when a marker-owned index cannot be read and releases ownership', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/index.html`, '<!-- @sys/tools: index -->\nstale');
      let replaced = false;

      await expectError(() =>
        stageMappings({
          cwd: tmp,
          stagingRoot: 'stage',
          mappings: [copy('src', '.')],
          onProgress(event) {
            if (replaced || event.kind !== 'mapping:done') return;
            replaced = true;
            Deno.removeSync(`${tmp}/stage/index.html`);
            Deno.mkdirSync(`${tmp}/stage/index.html`);
          },
        })
      );
      expect(await Fs.exists(`${tmp}/stage/dist.json`)).to.eql(false);

      const retried = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('src', '.')],
      });
      expect(retried.verification.dist.hash.parts['index.html']).to.not.eql(undefined);
    });
  });

  it('fails closed when a marker-owned index cannot be replaced and releases ownership', async () => {
    await withTmpDir(async (tmp) => {
      const sourceIndex = `${tmp}/src/index.html`;
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(sourceIndex, '<!-- @sys/tools: index -->\nstale');
      await Deno.chmod(sourceIndex, 0o444);

      const args = {
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('src', '.')],
      };
      await expectError(() => stageMappings(args));
      expect(await Fs.exists(`${tmp}/stage/dist.json`)).to.eql(false);

      await Deno.chmod(sourceIndex, 0o644);
      const retried = await stageMappings(args);
      const html = (await Fs.readText(`${tmp}/stage/index.html`)).data ?? '';
      expect(html.includes('stale')).to.eql(false);
      expect(retried.verification.dist.hash.parts['index.html']).to.not.eql(undefined);
    });
  });

  it('builds exact index-mapping navigation without child manifest links', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/shard.1`);
      await Fs.ensureDir(`${tmp}/src/shard.2`);
      await Fs.write(`${tmp}/src/shard.1/a.txt`, 'a');
      await Fs.write(`${tmp}/src/shard.2/b.txt`, 'b');

      const result = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [
          copy('src/shard.1', 'shard.1'),
          copy('src/shard.2', 'shard.2'),
          { mode: 'index', dir: { source: '.', staging: 'landing' } },
        ],
      });

      const path = `${tmp}/stage/landing/index.html`;
      const html = (await Fs.readText(path)).data ?? '';
      expect(html).to.include('href="../shard.1/index.html"');
      expect(html).to.include('href="../shard.2/index.html"');
      expect(html.includes('href=".//index.html"')).to.eql(false);
      expect(html).to.include('class="version"');
      expect(html.includes('href="./dist.json"')).to.eql(false);

      const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g), (match) => match[1]!);
      for (const href of hrefs) {
        const target = Path.fromFileUrl(new URL(href, Path.toFileUrl(path)));
        expect(await Fs.exists(target)).to.eql(true);
      }
      expect((await regularFiles(`${tmp}/stage`)).filter((item) => item.endsWith('/dist.json')))
        .to.eql([]);
      expect(result.verification.dist.hash.parts['landing/index.html']).to.not.eql(undefined);
    });
  });

  it('keeps explicit index projections independent of mapping order', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/shard.1`);
      await Fs.ensureDir(`${tmp}/src/shard.2`);
      await Fs.write(`${tmp}/src/shard.1/a.txt`, 'a');
      await Fs.write(`${tmp}/src/shard.2/b.txt`, 'b');

      const standard = [copy('src/shard.1', 'shard.1'), copy('src/shard.2', 'shard.2')];
      const landingA: t.DeployTool.Staging.Mapping = {
        mode: 'index',
        dir: { source: '.', staging: 'landing-a' },
      };
      const landingB: t.DeployTool.Staging.Mapping = {
        mode: 'index',
        dir: { source: '.', staging: 'landing-b' },
      };

      await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [...standard, landingA, landingB],
      });
      const firstA = (await Fs.readText(`${tmp}/stage/landing-a/index.html`)).data;
      const firstB = (await Fs.readText(`${tmp}/stage/landing-b/index.html`)).data;

      await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [...standard, landingB, landingA],
      });
      const secondA = (await Fs.readText(`${tmp}/stage/landing-a/index.html`)).data;
      const secondB = (await Fs.readText(`${tmp}/stage/landing-b/index.html`)).data;

      expect(firstA).to.eql(secondA);
      expect(firstB).to.eql(secondB);
      expect(firstA).to.include('href="../shard.1/index.html"');
      expect(firstA).to.include('href="../shard.2/index.html"');
      expect(firstA?.includes('landing-')).to.eql(false);
      expect(firstB?.includes('landing-')).to.eql(false);
    });
  });

  it('keeps a nested explicit index projection acyclic and mapping-order independent', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/shard.1`);
      await Fs.ensureDir(`${tmp}/src/shard.2`);
      await Fs.write(`${tmp}/src/shard.1/a.txt`, 'a');
      await Fs.write(`${tmp}/src/shard.2/b.txt`, 'b');

      const standard = [copy('src/shard.1', 'shard.1'), copy('src/shard.2', 'shard.2')];
      const nested: t.DeployTool.Staging.Mapping = {
        mode: 'index',
        dir: { source: '.', staging: 'indexes/root' },
      };

      await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [...standard, nested],
      });
      const firstNested = (await Fs.readText(`${tmp}/stage/indexes/root/index.html`)).data;
      const firstParent = (await Fs.readText(`${tmp}/stage/indexes/index.html`)).data;

      await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [nested, ...standard],
      });
      const secondNested = (await Fs.readText(`${tmp}/stage/indexes/root/index.html`)).data;
      const secondParent = (await Fs.readText(`${tmp}/stage/indexes/index.html`)).data;

      expect(firstNested).to.eql(secondNested);
      expect(firstParent).to.eql(secondParent);
      expect(firstNested).to.include('href="../../shard.1/index.html"');
      expect(firstNested).to.include('href="../../shard.2/index.html"');
      expect(firstNested?.includes('href="../index.html"')).to.eql(false);
      expect(firstParent).to.include('href="./root/index.html"');
    });
  });

  it('encodes generated navigation as exact URL paths with escaped labels', async () => {
    await withTmpDir(async (tmp) => {
      const destinations = ['release#1', '50%', 'space name', 'a&b', 'cafe', 'café'];
      const mappings: t.DeployTool.Staging.Mapping[] = [];
      for (const [index, destination] of destinations.entries()) {
        await Fs.ensureDir(`${tmp}/src/${index}`);
        await Fs.write(`${tmp}/src/${index}/file.txt`, destination);
        mappings.push(copy(`src/${index}`, destination));
      }

      await stageMappings({ cwd: tmp, stagingRoot: 'stage', mappings });
      const path = `${tmp}/stage/index.html`;
      const html = (await Fs.readText(path)).data ?? '';
      expect(html).to.include('href="./release%231/index.html"');
      expect(html).to.include('href="./50%25/index.html"');
      expect(html).to.include('href="./space%20name/index.html"');
      expect(html).to.include('href="./a%26b/index.html"');
      expect(html).to.include('a&amp;b</a>');
      expect(html.indexOf('cafe</a>') < html.indexOf('café</a>')).to.eql(true);

      const hrefs = Array.from(html.matchAll(/href="([^"]+)"/g), (match) => match[1]!);
      for (const href of hrefs) {
        const target = Path.fromFileUrl(new URL(href, Path.toFileUrl(path)));
        expect(await Fs.exists(target)).to.eql(true);
      }
    });
  });

  it('injects one build-reset token while preserving a custom index', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(
        `${tmp}/src/index.html`,
        '<!doctype html><html><head><meta name="x-build-reset" content="stale" /></head><body></body></html>',
      );

      await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        buildResetHtml: true,
        mappings: [copy('src', '.')],
      });

      const html = (await Fs.readText(`${tmp}/stage/index.html`)).data ?? '';
      expect(html.includes('content="stale"')).to.eql(false);
      expect((html.match(/name="x-build-reset"/g) ?? []).length).to.eql(1);
      expect(/content="\d{8}-[a-z0-9]{5}"/.test(html)).to.eql(true);
    });
  });

  it('fails closed when build reset cannot replace a custom index', async () => {
    await withTmpDir(async (tmp) => {
      const sourceIndex = `${tmp}/src/index.html`;
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(sourceIndex, '<!doctype html><html><body>custom</body></html>');
      await Deno.chmod(sourceIndex, 0o444);

      await expectError(() =>
        stageMappings({
          cwd: tmp,
          stagingRoot: 'stage',
          buildResetHtml: true,
          mappings: [copy('src', '.')],
        })
      );
      expect(await Fs.exists(`${tmp}/stage/dist.json`)).to.eql(false);
    });
  });

  it('adds build reset to an empty writable custom index', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/index.html`, '');

      const staged = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        buildResetHtml: true,
        mappings: [copy('src', '.')],
      });

      const html = (await Fs.readText(`${tmp}/stage/index.html`)).data ?? '';
      expect((html.match(/name="x-build-reset"/g) ?? []).length).to.eql(1);
      expect(/content="\d{8}-[a-z0-9]{5}"/.test(html)).to.eql(true);
      expect(staged.verification.dist.hash.parts['index.html']).to.not.eql(undefined);
    });
  });

  it('bounds and truncates verbose build output without losing the artifact', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/builder/dist`);
      await Fs.write(`${tmp}/builder/dist/index.html`, '<html>built</html>');
      await Fs.write(
        `${tmp}/builder/deno.json`,
        Json.stringify({
          tasks: {
            test: `deno eval 'console.log("x".repeat(9 * 1024 * 1024))'`,
            build: `deno eval ''`,
          },
        }),
      );

      const staged = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [{
          mode: 'build+copy',
          dir: { source: 'builder', staging: '.' },
        }],
      });
      expect(staged.verification.dist.hash.parts['index.html']).to.not.eql(undefined);
    });
  });

  it('cancels an in-flight build child and releases ownership', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/builder/dist`);
      await Fs.write(`${tmp}/builder/dist/index.html`, '<html>built</html>');
      const script = Str.dedent(`
        await Deno.writeTextFile("child.pid", String(Deno.pid));
        await new Promise((resolve) => setTimeout(resolve, 60_000));
      `).replaceAll('\n', ' ');
      await Fs.write(
        `${tmp}/builder/deno.json`,
        Json.stringify({
          tasks: {
            test: `deno eval --allow-write=. '${script}'`,
            build: `deno eval ''`,
          },
        }),
      );
      const controller = new AbortController();
      const pending = stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [{
          mode: 'build+copy',
          dir: { source: 'builder', staging: '.' },
        }],
        until: controller.signal,
      });

      const failed = expectError(() => pending, 'Cancelled test task');
      const pidPath = `${tmp}/builder/child.pid`;
      await waitFor(() => Fs.exists(pidPath));
      const pid = Number((await Fs.readText(pidPath)).data);
      controller.abort('test cancellation');
      await failed;
      await waitFor(() => Promise.resolve(!processExists(pid)));
      expect(await Fs.exists(`${tmp}/stage/dist.json`)).to.eql(false);

      const retried = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('builder/dist', '.')],
      });
      expect(retried.verification.dist.hash.parts['index.html']).to.not.eql(undefined);
    });
  });

  it('rejects an unknown internal mapping mode before root mutation', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/sentinel.txt`, 'sentinel');

      await expectError(
        () =>
          stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            mappings: [
              {
                mode: 'unknown',
                dir: { source: 'src', staging: '.' },
              } as unknown as t.DeployTool.Staging.Mapping,
            ],
          }),
        'mapping[0] is invalid: unsupported mode: unknown',
      );
      expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');
    });
  });

  it('rejects equal and ancestor mapping destinations before root mutation', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/a`);
      await Fs.ensureDir(`${tmp}/src/b`);
      await Fs.write(`${tmp}/src/a/a.txt`, 'a');
      await Fs.write(`${tmp}/src/b/b.txt`, 'b');
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/sentinel.txt`, 'sentinel');

      for (
        const mappings of [
          [copy('src/a', 'site'), copy('src/b', './site')],
          [copy('src/a', 'site'), copy('src/b', 'site/assets')],
          [copy('src/a', '.'), copy('src/b', 'site')],
        ]
      ) {
        await expectError(
          () => stageMappings({ cwd: tmp, stagingRoot: 'stage', mappings }),
          'mapping destinations overlap',
        );
        expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');
      }
    });
  });

  it('rejects portable destination aliases and unsafe staging forms before root mutation', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src/a`);
      await Fs.ensureDir(`${tmp}/src/b`);
      await Fs.write(`${tmp}/src/a/a.txt`, 'a');
      await Fs.write(`${tmp}/src/b/b.txt`, 'b');
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/sentinel.txt`, 'sentinel');

      for (
        const mappings of [
          [copy('src/a', 'Site'), copy('src/b', 'site')],
          [copy('src/a', 'CAFÉ'), copy('src/b', 'cafe\u0301')],
          [copy('src/a', 'Parent/a'), copy('src/b', 'parent/b')],
          [copy('src/a', 'CAFÉ/a'), copy('src/b', 'cafe\u0301/b')],
          [copy('src/a', 'dist.json')],
          [copy('src/a', 'DIST.JSON')],
          [copy('src/a', 'nested/index.html')],
          [copy('src/a', 'nested/INDEX.HTML')],
          [copy('src/a', '../output')],
          [copy('src/a', '/tmp/output')],
          [copy('src/a', 'C:/output')],
          [copy('src/a', 'C:output')],
          [copy('src/a', 'C:\\output')],
          [copy('src/a', '~/output')],
          [copy('src/a', '~user/output')],
          [copy('src/a', ' output')],
          [copy('src/a', 'output ')],
          [copy('src/a', 'output/')],
          [copy('src/a', 'output//nested')],
          [copy('src/a', 'output/.')],
          [copy('src/a', 'output.')],
          [copy('src/a', 'CON')],
          [copy('src/a', '.sys.rooted')],
          [copy('src/a', 'bad:name')],
        ]
      ) {
        await expectError(() => stageMappings({ cwd: tmp, stagingRoot: 'stage', mappings }));
        expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');
      }
    });
  });

  it('rejects portable ancestor aliases before build or progress and allows exact shared parents', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/builder/dist`);
      await Fs.write(`${tmp}/builder/dist/built.txt`, 'built');
      await Fs.write(
        `${tmp}/builder/deno.json`,
        Json.stringify({
          tasks: {
            test:
              `deno eval --allow-write="${tmp}" "await Deno.writeTextFile('${tmp}/build-ran.txt', 'ran')"`,
            build: `deno eval ""`,
          },
        }),
      );
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/source.txt`, 'source');
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/sentinel.txt`, 'sentinel');

      const build = (staging: string): t.DeployTool.Staging.Mapping => ({
        mode: 'build+copy',
        dir: { source: 'builder', staging },
      });
      let progress = 0;
      for (
        const mappings of [
          [build('Parent/a'), copy('src', 'parent/b')],
          [build('CAFÉ/a'), copy('src', 'cafe\u0301/b')],
        ]
      ) {
        await expectError(
          () =>
            stageMappings({
              cwd: tmp,
              stagingRoot: 'stage',
              mappings,
              onProgress: () => progress += 1,
            }),
          'destination ancestors have portable aliases',
        );
        expect(progress).to.eql(0);
        expect(await Fs.exists(`${tmp}/build-ran.txt`)).to.eql(false);
        expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');
      }

      await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [build('parent/a'), copy('src', 'parent/b')],
      });
      expect((await Fs.readText(`${tmp}/stage/parent/a/built.txt`)).data).to.eql('built');
      expect((await Fs.readText(`${tmp}/stage/parent/b/source.txt`)).data).to.eql('source');
      expect((await Fs.readText(`${tmp}/build-ran.txt`)).data).to.eql('ran');
    });
  });

  it('rejects edge-whitespace root and source aliases before sibling mutation', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.ensureDir(`${tmp}/src `);
      await Fs.write(`${tmp}/src/expected.txt`, 'expected');
      await Fs.write(`${tmp}/src /authored.txt`, 'authored');
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.ensureDir(`${tmp}/stage `);
      await Fs.write(`${tmp}/stage/sentinel.txt`, 'canonical');
      await Fs.write(`${tmp}/stage /sentinel.txt`, 'authored');

      await expectError(
        () => stageMappings({ cwd: tmp, stagingRoot: 'stage ', mappings: [copy('src', '.')] }),
        'leading or trailing whitespace is not allowed',
      );
      await expectError(
        () => stageMappings({ cwd: tmp, stagingRoot: 'stage', mappings: [copy('src ', '.')] }),
        'source path must not have leading or trailing whitespace',
      );
      await expectError(
        () =>
          stageMappings({
            cwd: tmp,
            sourceRoot: 'src ',
            stagingRoot: 'stage',
            mappings: [copy('.', '.')],
          }),
        'source root must not have leading or trailing whitespace',
      );

      expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('canonical');
      expect((await Fs.readText(`${tmp}/stage /sentinel.txt`)).data).to.eql('authored');
      expect((await Fs.readText(`${tmp}/src/expected.txt`)).data).to.eql('expected');
      expect((await Fs.readText(`${tmp}/src /authored.txt`)).data).to.eql('authored');
    });
  });

  it('rejects wrong-kind and overlapping mutable build sources before root mutation', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.write(`${tmp}/source.txt`, 'not-a-directory');
      await Fs.ensureDir(`${tmp}/builder/dist`);
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/sentinel.txt`, 'sentinel');

      await expectError(
        () =>
          stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            mappings: [copy('source.txt', '.')],
          }),
        'source could not be admitted as a canonical directory',
      );
      expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');

      await expectError(
        () =>
          stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            mappings: [
              { mode: 'build+copy', dir: { source: 'builder', staging: 'site' } },
              copy('builder/dist', 'assets'),
            ],
          }),
        'source mutation footprints overlap',
      );
      expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');
    });
  });

  it('rejects source/root overlap before reset or build execution', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/builder`);
      await Fs.write(
        `${tmp}/builder/deno.json`,
        Json.stringify({
          name: 'staging-overlap-build',
          version: '0.0.0',
          tasks: {
            test:
              `deno eval --allow-write="${tmp}" "await Deno.writeTextFile('${tmp}/ran.txt', 'ran')"`,
            build: `deno eval "Deno.exit(0)"`,
          },
        }),
      );
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/sentinel.txt`, 'sentinel');

      await expectError(
        () =>
          stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            sourceRoot: '.',
            mappings: [copy('.', '.')],
          }),
        'source overlaps the owned staging root',
      );
      expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');

      await expectError(
        () =>
          stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            mappings: [
              { mode: 'build+copy', dir: { source: 'builder', staging: 'site' } },
              copy('src', 'site/assets'),
            ],
          }),
        'mapping destinations overlap',
      );
      expect(await Fs.exists(`${tmp}/ran.txt`)).to.eql(false);
      expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');
    });
  });

  it('rejects a non-canonical cwd alias before root mutation', async () => {
    await withTmpDir(async (tmp) => {
      const real = `${tmp}/real/work`;
      await Fs.ensureDir(`${real}/src`);
      await Fs.write(`${real}/src/a.txt`, 'a');
      await Fs.ensureDir(`${real}/stage`);
      await Fs.write(`${real}/stage/sentinel.txt`, 'sentinel');
      await Fs.ensureSymlink(`${tmp}/real`, `${tmp}/alias`);

      await expectError(
        () =>
          stageMappings({
            cwd: `${tmp}/alias/work`,
            stagingRoot: 'stage',
            mappings: [copy('src', '.')],
          }),
        'working directory must be supplied by its canonical path',
      );
      expect((await Fs.readText(`${real}/stage/sentinel.txt`)).data).to.eql('sentinel');
    });
  });

  it('refuses symlinked roots and unsafe old trees without deleting outside bytes', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');
      await Fs.ensureDir(`${tmp}/outside`);
      await Fs.write(`${tmp}/outside/keep.txt`, 'keep');
      await Fs.ensureSymlink(`${tmp}/outside`, `${tmp}/stage`);

      await expectError(() =>
        stageMappings({ cwd: tmp, stagingRoot: 'stage', mappings: [copy('src', '.')] })
      );
      expect((await Fs.readText(`${tmp}/outside/keep.txt`)).data).to.eql('keep');

      await Fs.remove(`${tmp}/stage`, { log: false });
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.ensureSymlink(`${tmp}/outside/keep.txt`, `${tmp}/stage/linked.txt`);
      await expectError(() =>
        stageMappings({ cwd: tmp, stagingRoot: 'stage', mappings: [copy('src', '.')] })
      );
      expect((await Fs.readText(`${tmp}/outside/keep.txt`)).data).to.eql('keep');

      await Fs.remove(`${tmp}/stage`, { log: false });
      await Fs.ensureSymlink(`${tmp}/outside`, `${tmp}/stage-parent`);
      await expectError(() =>
        stageMappings({
          cwd: tmp,
          stagingRoot: 'stage-parent/nested',
          mappings: [copy('src', '.')],
        })
      );
      expect(await Fs.exists(`${tmp}/outside/nested`)).to.eql(false);
      expect((await Fs.readText(`${tmp}/outside/keep.txt`)).data).to.eql('keep');
    });
  });

  it('rejects callback replacement of the admitted source identity', async () => {
    await withTmpDir(async (tmp) => {
      const source = `${tmp}/src`;
      const displaced = `${tmp}/src.displaced`;
      const outside = `${tmp}/outside`;
      await Fs.ensureDir(source);
      await Fs.ensureDir(outside);
      await Fs.write(`${source}/expected.txt`, 'expected');
      await Fs.write(`${outside}/foreign.txt`, 'foreign');

      let replaced = false;
      await expectError(
        () =>
          stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            mappings: [copy('src', 'site')],
            onProgress(event) {
              if (replaced || event.kind !== 'mapping:step' || event.label !== 'copy') return;
              replaced = true;
              Deno.renameSync(source, displaced);
              Deno.symlinkSync(outside, source, { type: 'dir' });
            },
          }),
        'mapping source identity changed',
      );
      expect(await Fs.exists(`${tmp}/stage/site/foreign.txt`)).to.eql(false);
      expect((await Fs.readText(`${outside}/foreign.txt`)).data).to.eql('foreign');
    });
  });

  it('rejects callback destination symlinks without changing outside bytes', async () => {
    await withTmpDir(async (tmp) => {
      const destination = `${tmp}/stage/site`;
      const outside = `${tmp}/outside`;
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.ensureDir(outside);
      await Fs.write(`${tmp}/src/incoming.txt`, 'incoming');
      await Fs.write(`${outside}/sentinel.txt`, 'outside');

      let replaced = false;
      await expectError(
        () =>
          stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            mappings: [copy('src', 'site')],
            onProgress(event) {
              if (replaced || event.kind !== 'mapping:step' || event.label !== 'copy') return;
              replaced = true;
              Deno.removeSync(destination, { recursive: true });
              Deno.symlinkSync(outside, destination, { type: 'dir' });
            },
          }),
        'mapping destination identity changed',
      );
      expect((await Fs.readText(`${outside}/sentinel.txt`)).data).to.eql('outside');
      expect(await Fs.exists(`${outside}/incoming.txt`)).to.eql(false);
    });
  });

  it('rejects callback replacement of a plain destination directory', async () => {
    await withTmpDir(async (tmp) => {
      const destination = `${tmp}/stage/site`;
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');

      let replaced = false;
      await expectError(
        () =>
          stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            mappings: [copy('src', 'site')],
            onProgress(event) {
              if (replaced || event.kind !== 'mapping:done') return;
              replaced = true;
              Deno.renameSync(destination, `${destination}.displaced`);
              Deno.mkdirSync(destination);
            },
          }),
        'mapping destination identity changed',
      );
      expect(await Fs.exists(`${tmp}/stage/dist.json`)).to.eql(false);
    });
  });

  it('retracts a source-copied root manifest when progress fails after copy', async () => {
    await withTmpDir(async (tmp) => {
      const source = `${tmp}/src`;
      await Fs.ensureDir(source);
      await Fs.write(`${source}/a.txt`, 'a');
      const computed = await Pkg.Dist.compute({ dir: source, save: true });
      if (computed.error) throw computed.error;

      let verification: t.DeployTool.StageResult['verification'] | undefined;
      await expectError(
        async () => {
          const result = await stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            mappings: [copy('src', '.')],
            onProgress(event) {
              if (event.kind === 'mapping:done') {
                throw new Error('presentation-failure-after-copy');
              }
            },
          });
          verification = result.verification;
        },
        'presentation-failure-after-copy',
      );

      expect(verification).to.eql(undefined);
      expect(await Fs.exists(`${tmp}/stage/dist.json`)).to.eql(false);
      const retried = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('src', '.')],
      });
      expect(retried.verification.dist.hash.parts['a.txt']).to.not.eql(undefined);
    });
  });

  it('fails non-waiting ownership contention without touching the root', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');
      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/sentinel.txt`, 'sentinel');

      const rooted = await Fs.Capability.Rooted.create({ root: tmp, create: false });
      const admission = await rooted.Target.admit([{ kind: 'directory', path: 'stage' }]);
      const held = await rooted.Lease.acquire(admission.targets, { mode: 'exclusive' });
      if (held.kind !== 'acquired') throw new Error('Expected staging lease fixture.');

      try {
        await expectError(
          () => stageMappings({ cwd: tmp, stagingRoot: 'stage', mappings: [copy('src', '.')] }),
          'already owned by another operation',
        );
        expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');

        await expectError(
          () =>
            stageMappings({
              cwd: tmp,
              stagingRoot: 'stage/nested',
              mappings: [copy('src', '.')],
            }),
          'already owned by another operation',
        );
        expect(await Fs.exists(`${tmp}/stage/nested`)).to.eql(false);
        expect((await Fs.readText(`${tmp}/stage/sentinel.txt`)).data).to.eql('sentinel');
      } finally {
        await held.lease.release();
      }

      const retried = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('src', '.')],
      });
      expect(retried.verification.assets.files > 0).to.eql(true);
    });
  });

  it('detects replacement of the owned staging root during a build', async () => {
    await withTmpDir(async (tmp) => {
      const source = `${tmp}/builder`;
      await Fs.ensureDir(source);
      await Fs.write(
        `${source}/-build.ts`,
        [
          `await Deno.rename('../stage', '../displaced-stage');`,
          `await Deno.mkdir('../stage');`,
          `await Deno.mkdir('dist', { recursive: true });`,
          `await Deno.writeTextFile('dist/a.txt', 'a');`,
        ].join('\n'),
      );
      await Fs.write(
        `${source}/deno.json`,
        Json.stringify({
          name: 'staging-root-replacement',
          version: '0.0.0',
          tasks: {
            test: `deno eval "Deno.exit(0)"`,
            build: `deno run -A ./-build.ts`,
          },
        }),
      );

      await expectError(() =>
        stageMappings({
          cwd: tmp,
          stagingRoot: 'stage',
          mappings: [{ mode: 'build+copy', dir: { source: 'builder', staging: '.' } }],
        })
      );
      expect(await Fs.exists(`${tmp}/stage/dist.json`)).to.eql(false);
    });
  });

  it('releases ownership after build failure and cancellation', async () => {
    await withTmpDir(async (tmp) => {
      const source = `${tmp}/builder`;
      await Fs.ensureDir(source);
      await Fs.write(
        `${source}/deno.json`,
        Json.stringify({
          name: 'staging-build-failure',
          version: '0.0.0',
          tasks: {
            test: `deno eval "console.error('test failed'); Deno.exit(7)"`,
            build: `deno eval "Deno.exit(0)"`,
          },
        }),
      );

      let error: unknown;
      try {
        await stageMappings({
          cwd: tmp,
          stagingRoot: 'stage',
          mappings: [{ mode: 'build+copy', dir: { source: 'builder', staging: '.' } }],
        });
      } catch (cause) {
        error = cause;
      }
      expect(Cli.stripAnsi(error instanceof Error ? error.message : '')).to.include(
        `Failed test task: ${source} (exit 7)`,
      );

      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');
      const controller = new AbortController();
      await expectError(() =>
        stageMappings({
          cwd: tmp,
          stagingRoot: 'stage',
          until: controller.signal,
          mappings: [copy('src', '.')],
          onProgress(event) {
            if (event.kind === 'mapping:start') controller.abort('test-cancel');
          },
        })
      );

      const retried = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('src', '.')],
      });
      expect(retried.verification.dist.hash.parts['a.txt']).to.not.eql(undefined);
    });
  });

  it('keeps disjoint standard mappings concurrently bounded', async () => {
    await withTmpDir(async (tmp) => {
      const mappings: t.DeployTool.Staging.Mapping[] = [];
      for (let index = 0; index < 6; index += 1) {
        await Fs.ensureDir(`${tmp}/src/${index}`);
        await Fs.write(`${tmp}/src/${index}/file.txt`, String(index));
        mappings.push(copy(`src/${index}`, `out/${index}`));
      }

      let active = 0;
      let peak = 0;
      await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings,
        onProgress(event) {
          if (event.kind === 'mapping:start') {
            active += 1;
            peak = Math.max(peak, active);
          }
          if (event.kind === 'mapping:done' || event.kind === 'mapping:fail') active -= 1;
        },
      });

      expect(peak > 1).to.eql(true);
      expect(peak <= 4).to.eql(true);
      expect(active).to.eql(0);
    });
  });

  it('preserves nullish progress failures and releases ownership', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');

      let didThrow = false;
      let caught: unknown = 'not-thrown';
      try {
        await stageMappings({
          cwd: tmp,
          stagingRoot: 'stage',
          mappings: [copy('src', '.')],
          onProgress(event) {
            if (event.kind === 'mapping:start') throw undefined;
          },
        });
      } catch (error) {
        didThrow = true;
        caught = error;
      }
      expect(didThrow).to.eql(true);
      expect(caught).to.eql(undefined);

      const retried = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('src', '.')],
      });
      expect(retried.verification.dist.hash.parts['a.txt']).to.not.eql(undefined);
    });
  });

  it('preserves operation and release failures after leased rollback', async () => {
    const operation = new Error('operation-failure');
    const release = new Error('release-failure');
    const order: string[] = [];
    let caught: unknown;

    try {
      await settleStagingLease(
        {
          release() {
            order.push('release');
            return Promise.reject(release);
          },
        },
        () => Promise.reject(operation),
        {
          errorLabel: 'test rollback',
          onError() {
            order.push('rollback');
            return Promise.resolve();
          },
        },
      );
    } catch (error) {
      caught = error;
    }

    expect(order).to.eql(['rollback', 'release']);
    expect(caught).to.be.instanceOf(AggregateError);
    const aggregate = caught as AggregateError;
    expect(aggregate.cause).to.equal(operation);
    expect(aggregate.errors[0]).to.equal(operation);
    expect(aggregate.errors[1]).to.equal(release);
  });

  it('releases nested staging ownership before outer build-source ownership', async () => {
    const stagingFailure = new Error('staging-release-failure');
    const buildFailure = new Error('build-release-failure');
    const order: string[] = [];
    const lease = combineStagingLeases(
      {
        release() {
          order.push('staging');
          return Promise.reject(stagingFailure);
        },
      },
      {
        release() {
          order.push('build');
          return Promise.reject(buildFailure);
        },
      },
    );

    let caught: unknown;
    try {
      await lease.release();
    } catch (error) {
      caught = error;
    }

    expect(order).to.eql(['staging', 'build']);
    expect(caught).to.be.instanceOf(AggregateError);
    const aggregate = caught as AggregateError;
    expect(aggregate.cause).to.equal(stagingFailure);
    expect(aggregate.errors).to.eql([stagingFailure, buildFailure]);
  });

  it('does not run failed-generation rollback after a successful body release failure', async () => {
    const release = new Error('release-failure');
    let rolledBack = false;
    let caught: unknown;

    try {
      await settleStagingLease(
        { release: () => Promise.reject(release) },
        () => Promise.resolve('verified-generation'),
        {
          errorLabel: 'test rollback',
          onError() {
            rolledBack = true;
            return Promise.resolve();
          },
        },
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).to.equal(release);
    expect(rolledBack).to.eql(false);
  });

  it('keeps queued ownership blocked until failed-generation rollback settles', async () => {
    await withTmpDir(async (tmp) => {
      const owner = await Fs.Capability.Rooted.create({ root: tmp, create: false });
      const ownerAdmission = await owner.Target.admit([{ kind: 'directory', path: 'stage' }]);
      const held = await owner.Lease.acquire(ownerAdmission.targets, { mode: 'exclusive' });
      if (held.kind !== 'acquired') throw new Error('Expected owner lease fixture.');

      const queuedOwner = await Fs.Capability.Rooted.create({ root: tmp, create: false });
      const queuedAdmission = await queuedOwner.Target.admit([
        { kind: 'directory', path: 'stage' },
      ]);
      let queuedAcquired = false;
      const queued = queuedOwner.Lease.acquire(queuedAdmission.targets, {
        mode: 'exclusive',
        wait: true,
      }).then((result) => {
        queuedAcquired = result.kind === 'acquired';
        return result;
      });

      let signalRollbackStarted!: () => void;
      const rollbackStarted = new Promise<void>((resolve) => signalRollbackStarted = resolve);
      let finishRollback!: () => void;
      const rollbackGate = new Promise<void>((resolve) => finishRollback = resolve);
      const operation = new Error('failed-generation');
      const settlement = settleStagingLease(
        held.lease,
        () => Promise.reject(operation),
        {
          errorLabel: 'test rollback',
          async onError() {
            signalRollbackStarted();
            await rollbackGate;
          },
        },
      );

      await rollbackStarted;
      const probeOwner = await Fs.Capability.Rooted.create({ root: tmp, create: false });
      const probeAdmission = await probeOwner.Target.admit([
        { kind: 'directory', path: 'stage' },
      ]);
      const probe = await probeOwner.Lease.acquire(probeAdmission.targets, {
        mode: 'exclusive',
        wait: false,
      });
      const probeKind = probe.kind;
      const queuedBeforeRollback = queuedAcquired;
      if (probe.kind === 'acquired') await probe.lease.release();

      finishRollback();
      let caught: unknown;
      try {
        await settlement;
      } catch (error) {
        caught = error;
      }
      const acquired = await queued;
      if (acquired.kind === 'acquired') await acquired.lease.release();

      expect(probeKind).to.eql('busy');
      expect(queuedBeforeRollback).to.eql(false);
      expect(caught).to.equal(operation);
      expect(acquired.kind).to.eql('acquired');
    });
  });

  it('fails closed on temporary child-manifest mutation', async () => {
    await withTmpDir(async (tmp) => {
      const root = `${tmp}/stage`;
      const child = `${root}/nested`;
      await Fs.ensureDir(child);
      await Fs.write(`${child}/a.txt`, 'a');
      const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'test root' });

      await expectError(
        () =>
          finalizeDistTree({
            dir: root,
            rootIdentity,
            hooks: {
              afterManifest(dir) {
                if (dir === child) {
                  Deno.writeTextFileSync(`${child}/dist.json`, '{"tampered":true}\n');
                }
              },
            },
          }),
        'finalization failed and temporary-manifest cleanup also failed',
      );
      expect(await Fs.exists(`${root}/dist.json`)).to.eql(false);
      expect(await Fs.exists(`${child}/dist.json`)).to.eql(true);
    });
  });

  it('cancels cooperatively during a multi-file manifest hash', async () => {
    await withTmpDir(async (tmp) => {
      const root = `${tmp}/stage`;
      const child = `${root}/nested`;
      await Fs.ensureDir(child);
      const bytes = new Uint8Array(1024 * 1024);
      for (let index = 0; index < 8; index += 1) {
        bytes[0] = index;
        await Fs.write(`${child}/${index}.bin`, bytes);
      }
      const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'test root' });
      const controller = new AbortController();
      let progress = 0;

      await expectError(
        () =>
          finalizeDistTree({
            dir: root,
            rootIdentity,
            signal: controller.signal,
            hooks: {
              onHashProgress(event) {
                progress = event.current;
                if (event.current === 4) controller.abort('compute cancellation');
              },
            },
          }),
        'Deploy staging operation was cancelled',
      );
      expect(progress).to.eql(4);
      expect(await Fs.exists(`${root}/dist.json`)).to.eql(false);
      expect(await Fs.exists(`${child}/dist.json`)).to.eql(false);
    });
  });

  it('cancels finalization and removes already-created child manifests', async () => {
    await withTmpDir(async (tmp) => {
      const root = `${tmp}/stage`;
      const child = `${root}/nested`;
      await Fs.ensureDir(child);
      await Fs.write(`${child}/a.txt`, 'a');
      const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'test root' });
      const controller = new AbortController();

      await expectError(
        () =>
          finalizeDistTree({
            dir: root,
            rootIdentity,
            signal: controller.signal,
            hooks: {
              afterManifest(dir) {
                if (dir === child) controller.abort('test cancellation');
              },
            },
          }),
        'Deploy staging operation was cancelled',
      );
      expect(await Fs.exists(`${root}/dist.json`)).to.eql(false);
      expect(await Fs.exists(`${child}/dist.json`)).to.eql(false);
    });
  });

  it('cancels after root finalization without leaving manifest authority', async () => {
    await withTmpDir(async (tmp) => {
      const root = `${tmp}/stage`;
      await Fs.ensureDir(root);
      await Fs.write(`${root}/a.txt`, 'a');
      const rootIdentity = await captureDirectoryIdentity({ path: root, label: 'test root' });
      const controller = new AbortController();

      await expectError(
        () =>
          finalizeDistTree({
            dir: root,
            rootIdentity,
            signal: controller.signal,
            hooks: {
              afterManifest(dir) {
                if (dir === root) controller.abort('test cancellation');
              },
            },
          }),
        'Deploy staging operation was cancelled',
      );
      expect(await Fs.exists(`${root}/dist.json`)).to.eql(false);
    });
  });

  it('returns no evidence and retracts root authority when strict verification fails', async () => {
    await withTmpDir(async (tmp) => {
      const source = `${tmp}/src`;
      await Fs.ensureDir(source);
      const sourceFiles = DIST_VERIFY_LIMITS.entries - 1;
      const batchSize = 64;
      for (let start = 0; start < sourceFiles; start += batchSize) {
        const writes: Promise<unknown>[] = [];
        const end = Math.min(sourceFiles, start + batchSize);
        for (let index = start; index < end; index++) {
          const name = String(index).padStart(4, '0');
          writes.push(Fs.write(`${source}/${name}.txt`, ''));
        }
        await Promise.all(writes);
      }

      let verification: t.DeployTool.StageResult['verification'] | undefined;
      await expectError(
        async () => {
          const result = await stageMappings({
            cwd: tmp,
            stagingRoot: 'stage',
            mappings: [copy('src', '.')],
          });
          verification = result.verification;
        },
        'Deploy staging verification failed: limit-exceeded',
      );

      expect(verification).to.eql(undefined);
      expect(await Fs.exists(`${tmp}/stage/index.html`)).to.eql(true);
      expect(await Fs.exists(`${tmp}/stage/dist.json`)).to.eql(false);
    });
  });

  it('fails closed when verified bytes change or gain an undeclared entry', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');
      const staged = await stageMappings({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [copy('src', '.')],
      });

      await Fs.write(`${tmp}/stage/a.txt`, 'changed');
      await expectError(
        () => verifyStagedDist(staged.stagingRoot),
        'Deploy staging verification failed: content-mismatch',
      );

      await Fs.write(`${tmp}/stage/a.txt`, 'a');
      await Fs.write(`${tmp}/stage/extra.txt`, 'extra');
      await expectError(
        () => verifyStagedDist(staged.stagingRoot),
        'Deploy staging verification failed: unexpected-entry',
      );
    });
  });

  it('freezes the finite verification policy on both contract planes', () => {
    const compileOnlyMutation = () => {
      // @ts-expect-error The shared verification policy is immutable output state.
      DIST_VERIFY_LIMITS.entries = 1;
    };
    expect(compileOnlyMutation).to.be.instanceOf(Function);

    expect(DIST_VERIFY_LIMITS).to.eql({
      manifestBytes: 16 * 1024 * 1024,
      entries: 8_193,
      fileBytes: 128 * 1024 * 1024,
      totalBytes: 1024 * 1024 * 1024,
    });
    expect(Object.isFrozen(DIST_VERIFY_LIMITS)).to.eql(true);
  });
});

async function regularFiles(root: string): Promise<readonly string[]> {
  const entries = await Fs.glob(root, { includeDirs: false }).find('**/*');
  const files = entries.map((entry) => {
    const relative = Path.relative(root, entry.path);
    if (Path.Is.absolute(relative) || !Path.Is.within(root, entry.path)) {
      throw new Error(`Deploy staging test file escaped its root: ${entry.path}`);
    }
    return Path.relativePosix(relative);
  });
  return Object.freeze(files.toSorted());
}

async function waitFor(predicate: () => Promise<boolean>, attempts = 500): Promise<void> {
  for (let index = 0; index < attempts; index++) {
    if (await predicate()) return;
    await Time.delay(10);
  }
  throw new Error('Timed out waiting for the staging test condition.');
}

function processExists(pid: number): boolean {
  try {
    Deno.kill(pid, 0);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
