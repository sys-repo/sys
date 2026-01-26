import { withTmpDir } from '../../-test/-fixtures.ts';
import { type t, describe, expect, Fs, it } from '../../../-test.ts';
import { Json, Pkg, Path } from '../../common.ts';
import { executeStaging } from '../u.staging.execute.ts';

describe('Staging: executeStaging', () => {
  const stageOptions = (tmp: t.StringDir) => {
    return {
      cwd: tmp,
      stagingRoot: 'stage',
      cleanStagingRoot: true,
      writeDistJson: true,
      onWriteDistJson: async (args: { stagingRoot: string }) => {
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

      const dir = { source: 'src', staging: '.' };

      await executeStaging({ ...stageOptions(tmp), mappings: [{ mode: 'copy', dir }] });

      const text = (await Fs.readText(`${tmp}/stage/a.txt`)).data!;
      expect(text).to.eql('hello');
      await assertDistJsonExists(`${tmp}/stage`);
    });
  });

  it('copy: creates staging dir if missing', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'x');

      const dir = { source: 'src', staging: '.' };
      await executeStaging({ ...stageOptions(tmp), mappings: [{ mode: 'copy', dir }] });

      const res = await Fs.readText(`${tmp}/stage/a.txt`);
      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.data).to.eql('x');
      await assertDistJsonExists(`${tmp}/stage`);
    });
  });

  it('copy: generates index.html inside mapping target when missing', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'x');

      const dir = { source: 'src', staging: 'dist/site' };
      await executeStaging({ ...stageOptions(tmp), mappings: [{ mode: 'copy', dir }] });

      const index = await Fs.readText(`${tmp}/stage/dist/site/index.html`);
      expect(index.ok).to.eql(true);
      expect(index.exists).to.eql(true);
      expect(String(index.data ?? '')).to.include('<!-- @sys/tools staging index -->');
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

      const dir = { source: 'src', staging: '.' };
      await executeStaging({ ...stageOptions(tmp), mappings: [{ mode: 'build+copy', dir }] });

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
        tasks: { build: `deno eval "Deno.exit(1)"` },
      });

      await Fs.write(`${srcRoot}/deno.json`, denoJson);

      const events: Array<{ kind: string; index: number }> = [];
      const mappings = [{ mode: 'build+copy' as const, dir: { source: 'src', staging: '.' } }];

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
        await executeStaging({ ...opts, mappings });
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

  it('copy: overwrite=false preserves existing files (skips); directories merge; merges from prior', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src1/assets`);
      await Fs.ensureDir(`${tmp}/src2/assets`);

      await Fs.write(`${tmp}/src1/a.txt`, 'first');
      await Fs.write(`${tmp}/src2/a.txt`, 'second');

      await Fs.write(`${tmp}/src1/assets/one.txt`, 'one');
      await Fs.write(`${tmp}/src2/assets/two.txt`, 'two');

      await Fs.write(`${tmp}/src1/assets/shared.txt`, 'shared-1');
      await Fs.write(`${tmp}/src2/assets/shared.txt`, 'shared-2');

      const mappings = [
        { mode: 'copy' as const, dir: { source: 'src1', staging: '.' } },
        { mode: 'copy' as const, dir: { source: 'src2', staging: '.' } },
      ];

      await executeStaging({ mappings, ...stageOptions(tmp) });

      const a = await Fs.readText(`${tmp}/stage/a.txt`);
      expect(a.ok).to.eql(true);
      expect(a.exists).to.eql(true);
      expect(a.data).to.eql('first');

      const one = await Fs.readText(`${tmp}/stage/assets/one.txt`);
      expect(one.ok).to.eql(true);
      expect(one.exists).to.eql(true);
      expect(one.data).to.eql('one');

      const two = await Fs.readText(`${tmp}/stage/assets/two.txt`);
      expect(two.ok).to.eql(true);
      expect(two.exists).to.eql(true);
      expect(two.data).to.eql('two');

      const shared = await Fs.readText(`${tmp}/stage/assets/shared.txt`);
      expect(shared.ok).to.eql(true);
      expect(shared.exists).to.eql(true);
      expect(shared.data).to.eql('shared-1');

      await assertDistJsonExists(`${tmp}/stage`);
    });
  });

  it('copy: overwrite=true overwrites existing files (last write wins); directories merge', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src1/assets`);
      await Fs.ensureDir(`${tmp}/src2/assets`);

      await Fs.write(`${tmp}/src1/a.txt`, 'first');
      await Fs.write(`${tmp}/src2/a.txt`, 'second');

      await Fs.write(`${tmp}/src1/assets/one.txt`, 'one');
      await Fs.write(`${tmp}/src2/assets/two.txt`, 'two');

      await Fs.write(`${tmp}/src1/assets/shared.txt`, 'shared-1');
      await Fs.write(`${tmp}/src2/assets/shared.txt`, 'shared-2');

      const mappings = [
        { mode: 'copy' as const, dir: { source: 'src1', staging: '.' } },
        { mode: 'copy' as const, dir: { source: 'src2', staging: '.' } },
      ];

      await executeStaging({ ...stageOptions(tmp), mappings, overwrite: true });

      const a = await Fs.readText(`${tmp}/stage/a.txt`);
      expect(a.ok).to.eql(true);
      expect(a.exists).to.eql(true);
      expect(a.data).to.eql('second');

      const one = await Fs.readText(`${tmp}/stage/assets/one.txt`);
      expect(one.ok).to.eql(true);
      expect(one.exists).to.eql(true);
      expect(one.data).to.eql('one');

      const two = await Fs.readText(`${tmp}/stage/assets/two.txt`);
      expect(two.ok).to.eql(true);
      expect(two.exists).to.eql(true);
      expect(two.data).to.eql('two');

      const shared = await Fs.readText(`${tmp}/stage/assets/shared.txt`);
      expect(shared.ok).to.eql(true);
      expect(shared.exists).to.eql(true);
      expect(shared.data).to.eql('shared-2');

      await assertDistJsonExists(`${tmp}/stage`);
    });
  });

  it('cleanStagingRoot: deletes only the staging target (preserves siblings)', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/new.txt`, 'new');

      await Fs.ensureDir(`${tmp}/stage/dist/my-output`);
      await Fs.ensureDir(`${tmp}/stage/dist/keep`);
      await Fs.ensureDir(`${tmp}/stage/other`);

      await Fs.write(`${tmp}/stage/dist/my-output/old.txt`, 'old');
      await Fs.write(`${tmp}/stage/dist/keep/keep.txt`, 'keep');
      await Fs.write(`${tmp}/stage/other/other.txt`, 'other');

      const dir = { source: 'src', staging: 'dist/my-output' };
      await executeStaging({ ...stageOptions(tmp), mappings: [{ mode: 'copy', dir }] });

      const old = await Fs.readText(`${tmp}/stage/dist/my-output/old.txt`);
      expect(old.exists).to.eql(false);

      const fresh = await Fs.readText(`${tmp}/stage/dist/my-output/new.txt`);
      expect(fresh.data).to.eql('new');

      const keep = await Fs.readText(`${tmp}/stage/dist/keep/keep.txt`);
      expect(keep.data).to.eql('keep');

      const other = await Fs.readText(`${tmp}/stage/other/other.txt`);
      expect(other.data).to.eql('other');
    });
  });

  it('cleanStagingRoot: staging "." cleans root without touching outside files', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/new.txt`, 'new');

      await Fs.ensureDir(`${tmp}/stage/sub`);
      await Fs.write(`${tmp}/stage/keep.txt`, 'keep');
      await Fs.write(`${tmp}/stage/sub/keep.txt`, 'keep-sub');
      await Fs.write(`${tmp}/outside.txt`, 'outside');

      const dir = { source: 'src', staging: '.' };
      await executeStaging({ ...stageOptions(tmp), mappings: [{ mode: 'copy', dir }] });

      const keep = await Fs.readText(`${tmp}/stage/keep.txt`);
      expect(keep.exists).to.eql(false);

      const keepSub = await Fs.readText(`${tmp}/stage/sub/keep.txt`);
      expect(keepSub.exists).to.eql(false);

      const fresh = await Fs.readText(`${tmp}/stage/new.txt`);
      expect(fresh.data).to.eql('new');

      const outside = await Fs.readText(`${tmp}/outside.txt`);
      expect(outside.data).to.eql('outside');
    });
  });

  it('cleanStagingRoot: shared target cleans once (keeps first mapping output)', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src1`);
      await Fs.ensureDir(`${tmp}/src2`);

      await Fs.write(`${tmp}/src1/a.txt`, 'first');
      await Fs.write(`${tmp}/src2/a.txt`, 'second');
      await Fs.write(`${tmp}/src2/b.txt`, 'second-b');

      await Fs.ensureDir(`${tmp}/stage/dist/my-output`);
      await Fs.write(`${tmp}/stage/dist/my-output/old.txt`, 'old');

      const mappings = [
        { mode: 'copy' as const, dir: { source: 'src1', staging: 'dist/my-output' } },
        { mode: 'copy' as const, dir: { source: 'src2', staging: 'dist/my-output' } },
      ];

      await executeStaging({ ...stageOptions(tmp), mappings });

      const a = await Fs.readText(`${tmp}/stage/dist/my-output/a.txt`);
      expect(a.data).to.eql('first');

      const b = await Fs.readText(`${tmp}/stage/dist/my-output/b.txt`);
      expect(b.data).to.eql('second-b');
    });
  });

  it('cleanStagingRoot: regenerates root index.html when targets are cleaned', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/new.txt`, 'new');

      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/index.html`, '<!-- @sys/tools staging index -->\n');

      const dir = { source: 'src', staging: 'dist/my-output' };
      await executeStaging({ ...stageOptions(tmp), mappings: [{ mode: 'copy', dir }] });

      const index = await Fs.readText(`${tmp}/stage/index.html`);
      expect(index.data).to.not.eql('<!-- @sys/tools staging index -->\n');
    });
  });

  it('cleanStagingRoot: does not overwrite non-template index.html', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/new.txt`, 'new');

      await Fs.ensureDir(`${tmp}/stage`);
      await Fs.write(`${tmp}/stage/index.html`, '<!doctype html><title>real</title>');

      const dir = { source: 'src', staging: 'dist/my-output' };
      await executeStaging({ ...stageOptions(tmp), mappings: [{ mode: 'copy', dir }] });

      const index = await Fs.readText(`${tmp}/stage/index.html`);
      expect(index.data).to.eql('<!doctype html><title>real</title>');
    });
  });

  it('sourceRoot/stagingRoot "." resolves to their bases', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src-base`);
      await Fs.write(`${tmp}/src-base/a.txt`, 'base');

      const events: t.DeployTool.Staging.ProgressEvent[] = [];

      await executeStaging({
        ...stageOptions(tmp),
        sourceRoot: 'src-base',
        mappings: [{ mode: 'copy', dir: { source: '.', staging: '.' } }],
        onProgress(e) {
          if (e.kind === 'mapping:start') events.push(e);
        },
      });

      expect(events.length).to.eql(1);
      expect(events[0].source).to.eql(Path.resolve(tmp, 'src-base'));
      expect(events[0].staging).to.eql(Path.resolve(tmp, 'stage'));
      expect((await Fs.readText(`${tmp}/stage/a.txt`)).data).to.eql('base');
    });
  });

  it('absolute mapping paths bypass sourceRoot base', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src-base`);

      const absoluteSource = (`${tmp}/absolute-source`) as t.StringDir;
      await Fs.ensureDir(absoluteSource);
      await Fs.write(`${absoluteSource}/abs.txt`, 'absolute');

      const events: t.DeployTool.Staging.ProgressEvent[] = [];

      await executeStaging({
        ...stageOptions(tmp),
        sourceRoot: 'src-base',
        mappings: [{ mode: 'copy', dir: { source: absoluteSource, staging: '.' } }],
        onProgress(e) {
          if (e.kind === 'mapping:start') events.push(e);
        },
      });

      expect(events.length).to.eql(1);
      expect(events[0].source).to.eql(absoluteSource);
      expect(events[0].staging).to.eql(Path.resolve(tmp, 'stage'));
      expect((await Fs.readText(`${tmp}/stage/abs.txt`)).data).to.eql('absolute');

    });
  });

  it('tilde base paths expand before rebasing', async () => {
    await withTmpDir(async (tmp) => {
      const home = tmp;
      const tildeDir = (`${tmp}/tilde-root`) as t.StringDir;
      await Fs.ensureDir(tildeDir);
      const relative = Path.relative(home, tildeDir);
      await Fs.write(`${tildeDir}/tilde.txt`, 'home');

      const oldHome = Deno.env.get('HOME');
      Deno.env.set('HOME', home);

      const events: t.DeployTool.Staging.ProgressEvent[] = [];

      try {
        await executeStaging({
          ...stageOptions(tmp),
          sourceRoot: `~/${relative}`,
          mappings: [{ mode: 'copy', dir: { source: '.', staging: '.' } }],
          onProgress(e) {
            if (e.kind === 'mapping:start') events.push(e);
          },
        });
      } finally {
        if (oldHome === undefined) {
          Deno.env.delete('HOME');
        } else {
          Deno.env.set('HOME', oldHome);
        }
      }

      expect(events.length).to.eql(1);
      expect(events[0].source).to.eql(tildeDir);
      expect((await Fs.readText(`${tmp}/stage/tilde.txt`)).data).to.eql('home');

      await Fs.remove(tildeDir);
    });
  });
});
