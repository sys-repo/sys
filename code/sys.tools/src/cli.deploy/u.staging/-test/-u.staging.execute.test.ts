import { withTmpDir } from '../../-test/-fixtures.ts';
import { describe, expect, Fs, it } from '../../../-test.ts';
import { Json, Pkg } from '../../common.ts';
import { executeStaging } from '../u.staging.execute.ts';

describe('Staging: executeStaging', () => {
  const stageOptions = (tmp: string) => {
    const stagingRoot = `${tmp}/stage`;

    return {
      cwd: tmp,
      stagingRoot,
      cleanStagingRoot: true,
      writeDistJson: true,
      onWriteDistJson: async (args: { readonly stagingRoot: string }) => {
        await Pkg.Dist.compute({ dir: args.stagingRoot, save: true });
      },
    } as const;
  };

  const assertDistJsonExists = async (stageDir: string) => {
    const dist = await Fs.readJson(`${stageDir}/dist.json`);
    expect(dist.ok).to.eql(true);
    expect(dist.exists).to.eql(true);
  };

  it('copy: copies source dir into staging dir (relative to cwd)', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'hello');

      const dir = { source: 'src', staging: 'stage' };
      await executeStaging([{ mode: 'copy', dir }], stageOptions(tmp));

      const text = (await Fs.readText(`${tmp}/stage/a.txt`)).data!;
      expect(text).to.eql('hello');
      await assertDistJsonExists(`${tmp}/stage`);
    });
  });

  it('copy: creates staging dir if missing', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'x');

      const dir = { source: 'src', staging: 'stage' };
      await executeStaging([{ mode: 'copy', dir }], stageOptions(tmp));

      const res = await Fs.readText(`${tmp}/stage/a.txt`);
      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.data).to.eql('x');
      await assertDistJsonExists(`${tmp}/stage`);
    });
  });

  it('build+copy: runs build tasks then stages /dist output', async () => {
    await withTmpDir(async (tmp) => {
      const srcRoot = `${tmp}/src`;
      await Fs.ensureDir(srcRoot);

      const buildFile = [
        `await Deno.mkdir("dist", { recursive: true });`,
        `await Deno.writeTextFile("dist/a.txt", "built");`,
        ``,
      ].join('\n');

      const denoJson = Json.stringify({
        name: 'tmp-staging-build',
        version: '0.0.0',
        tasks: {
          test: `deno eval "Deno.exit(0)"`,
          build: `deno run -A ./-build.ts`,
        },
      });

      await Fs.write(`${srcRoot}/-build.ts`, buildFile);
      await Fs.write(`${srcRoot}/deno.json`, denoJson);

      const dir = { source: 'src', staging: 'stage' };
      await executeStaging([{ mode: 'build+copy', dir }], stageOptions(tmp));

      const res = await Fs.readText(`${tmp}/stage/a.txt`);
      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.data).to.eql('built');
      await assertDistJsonExists(`${tmp}/stage`);
    });
  });

  it('failure: emits mapping:fail and throws first error (no mapping:done); does not write dist.json', async () => {
    await withTmpDir(async (tmp) => {
      const srcRoot = `${tmp}/src`;
      await Fs.ensureDir(srcRoot);

      // deterministic failing build task
      const denoJson = Json.stringify({
        name: 'tmp-staging-fail',
        version: '0.0.0',
        tasks: {
          build: `deno eval "Deno.exit(1)"`,
        },
      });

      await Fs.write(`${srcRoot}/deno.json`, denoJson);

      const events: Array<{ kind: string; index: number }> = [];
      const mappings = [{ mode: 'build+copy' as const, dir: { source: 'src', staging: 'stage' } }];

      let threw = false;
      let writeCalled = false;

      const opts = {
        ...stageOptions(tmp),
        onProgress(e: { kind: string; index: number }) {
          events.push({ kind: e.kind, index: e.index });
        },
        onWriteDistJson: async (args: { readonly stagingRoot: string }) => {
          writeCalled = true;
          await Pkg.Dist.compute({ dir: args.stagingRoot, save: true });
        },
      } as const;

      try {
        await executeStaging(mappings, opts);
      } catch {
        threw = true;
      }

      expect(threw).to.eql(true);

      const starts = events.filter((e) => e.kind === 'mapping:start');
      const fails = events.filter((e) => e.kind === 'mapping:fail');
      const dones = events.filter((e) => e.kind === 'mapping:done');

      expect(starts.length).to.eql(1);
      expect(fails.length).to.eql(1);
      expect(dones.length).to.eql(0);

      expect(writeCalled).to.eql(false);

      const dist = await Fs.readJson(`${tmp}/stage/dist.json`);
      expect(dist.exists).to.eql(false);
    });
  });
});
