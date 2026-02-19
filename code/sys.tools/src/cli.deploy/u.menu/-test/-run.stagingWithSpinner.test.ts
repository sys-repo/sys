import { describe, expect, Fs, it, Pkg, Str } from '../../../-test.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';
import { runStagingWithSpinner } from '../run.stagingWithSpinner.ts';

describe('Staging: runStagingWithSpinner', () => {
  it('regenerates root dist.json when cleanStagingRoot runs', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');

      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/dist.json`, 'sentinel');

      const mappings = [{ mode: 'copy' as const, dir: { source: 'src', staging: '.' } }];
      const res = await runStagingWithSpinner({
        cwd: tmp,
        mappings,
        stagingRoot: 'stage',
        clear: true,
      });
      expect(res.ok).to.eql(true);

      const text = (await Fs.readText(`${tmp}/stage/dist.json`)).data!;
      expect(text).to.not.eql('sentinel');

      const dist = await Pkg.Dist.load(`${tmp}/stage`);
      expect(dist.exists).to.eql(true);
    });
  });

  it('finalizer: recomputes child dist and keeps root hash truthful', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');

      const childDir = `${tmp}/stage/child`;
      await Fs.ensureDir(childDir);
      await Fs.write(`${childDir}/a.txt`, 'v1');
      await Pkg.Dist.compute({
        dir: childDir,
        pkg: { name: '@child/pkg', version: '0.0.0' },
        builder: { name: '@child/pkg', version: '0.0.0' },
        save: true,
      });
      await Fs.remove(`${childDir}/a.txt`);

      const mappings = [{ mode: 'copy' as const, dir: { source: 'src', staging: 'other' } }];
      const res = await runStagingWithSpinner({ cwd: tmp, mappings, stagingRoot: 'stage' });
      expect(res.ok).to.eql(true);

      const child = await Pkg.Dist.load(`${tmp}/stage/child`);
      expect(child.exists).to.eql(true);
      expect(child.dist?.hash.parts['a.txt']).to.eql(undefined);

      const root = await Pkg.Dist.load(`${tmp}/stage`);
      expect(root.exists).to.eql(true);
      expect(root.dist?.hash.parts['child/a.txt']).to.eql(undefined);
      expect(root.dist?.hash.parts['child/.DS_Store']).to.eql(undefined);
    });
  });

  it('finalizer: writes dist.json for intermediate directories', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');

      const mappings = [{ mode: 'copy' as const, dir: { source: 'src', staging: 'releases/sys.app.shell' } }];

      const first = await runStagingWithSpinner({
        cwd: tmp,
        mappings,
        stagingRoot: 'stage',
        clear: true,
      });
      expect(first.ok).to.eql(true);

      const releases = await Pkg.Dist.load(`${tmp}/stage/releases`);
      expect(releases.exists).to.eql(true);
      const hash1 = String(releases.dist?.hash?.digest ?? '').trim();
      expect(hash1).to.not.eql('');
      const root1 = await Pkg.Dist.load(`${tmp}/stage`);
      const rootHash1 = String(root1.dist?.hash?.digest ?? '').trim();
      expect(rootHash1).to.not.eql('');

      const second = await runStagingWithSpinner({
        cwd: tmp,
        mappings,
        stagingRoot: 'stage',
      });
      expect(second.ok).to.eql(true);

      const releases2 = await Pkg.Dist.load(`${tmp}/stage/releases`);
      const hash2 = String(releases2.dist?.hash?.digest ?? '').trim();
      expect(hash2).to.eql(hash1);
      const root2 = await Pkg.Dist.load(`${tmp}/stage`);
      const rootHash2 = String(root2.dist?.hash?.digest ?? '').trim();
      expect(rootHash2).to.eql(rootHash1);
    });
  });

  it('build+copy: root dist hash is idempotent across repeated no-op staging runs', async () => {
    await withTmpDir(async (tmp) => {
      const srcRoot = `${tmp}/src`;
      await Fs.ensureDir(srcRoot);

      const buildFile = Str.dedent(`
        await Deno.mkdir('dist', { recursive: true });
        await Deno.writeTextFile('dist/a.txt', 'built');
      `);

      const denoJson = Str.dedent(`
        {
          "name": "tmp-staging-build",
          "version": "0.0.0",
          "tasks": {
            "test": "deno eval \\"Deno.exit(0)\\"",
            "build": "deno run -A ./-build.ts"
          }
        }
      `);

      await Fs.write(`${srcRoot}/-build.ts`, buildFile);
      await Fs.write(`${srcRoot}/deno.json`, denoJson);

      const mappings = [{ mode: 'build+copy' as const, dir: { source: 'src', staging: '.' } }];

      const a = await runStagingWithSpinner({
        cwd: tmp,
        mappings,
        stagingRoot: 'stage',
        clear: true,
      });
      expect(a.ok).to.eql(true);
      const first = await Pkg.Dist.load(`${tmp}/stage`);
      const hash1 = String(first.dist?.hash?.digest ?? '').trim();
      expect(hash1).to.not.eql('');

      const b = await runStagingWithSpinner({
        cwd: tmp,
        mappings,
        stagingRoot: 'stage',
      });
      expect(b.ok).to.eql(true);
      const second = await Pkg.Dist.load(`${tmp}/stage`);
      const hash2 = String(second.dist?.hash?.digest ?? '').trim();

      expect(hash2).to.eql(hash1);
    });
  });

  it('build+copy: sync removes stale compiled files from staging target', async () => {
    await withTmpDir(async (tmp) => {
      const srcRoot = `${tmp}/src`;
      await Fs.ensureDir(srcRoot);
      await Fs.write(`${srcRoot}/mode.txt`, 'v1');

      const buildFile = Str.dedent(`
        await Deno.remove('dist', { recursive: true }).catch(() => {});
        await Deno.mkdir('dist', { recursive: true });
        const mode = (await Deno.readTextFile('./mode.txt')).trim();
        await Deno.writeTextFile(\`dist/chunk-\${mode}.js\`, mode);
      `);

      const denoJson = Str.dedent(`
        {
          "name": "tmp-staging-build",
          "version": "0.0.0",
          "tasks": {
            "test": "deno eval \\"Deno.exit(0)\\"",
            "build": "deno run -A ./-build.ts"
          }
        }
      `);

      await Fs.write(`${srcRoot}/-build.ts`, buildFile);
      await Fs.write(`${srcRoot}/deno.json`, denoJson);

      const mappings = [{ mode: 'build+copy' as const, dir: { source: 'src', staging: '.' } }];

      const first = await runStagingWithSpinner({
        cwd: tmp,
        mappings,
        stagingRoot: 'stage',
        clear: true,
      });
      expect(first.ok).to.eql(true);
      expect(await Fs.exists(`${tmp}/stage/chunk-v1.js`)).to.eql(true);

      await Fs.write(`${srcRoot}/mode.txt`, 'v2');
      const second = await runStagingWithSpinner({
        cwd: tmp,
        mappings,
        stagingRoot: 'stage',
      });
      expect(second.ok).to.eql(true);
      expect(await Fs.exists(`${tmp}/stage/chunk-v2.js`)).to.eql(true);
      expect(await Fs.exists(`${tmp}/stage/chunk-v1.js`)).to.eql(false);
    });
  });
});
