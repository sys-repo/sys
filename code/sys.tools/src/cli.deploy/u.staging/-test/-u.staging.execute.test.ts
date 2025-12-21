import { withTmpDir } from '../../-test/-fixtures.ts';
import { describe, expect, Fs, it } from '../../../-test.ts';
import { Json, Pkg } from '../../common.ts';
import { executeStaging } from '../u.staging.execute.ts';

describe('Staging: executeStaging', () => {
  const assertDistJsonVerified = async (stageDir: string) => {
    const dist = await Fs.readJson(`${stageDir}/dist.json`);
    expect(dist.ok).to.eql(true);
    expect(dist.exists).to.eql(true);

    const verify = await Pkg.Dist.verify(stageDir);
    expect(verify.exists).to.eql(true);
    expect(verify.dist !== undefined).to.eql(true);
    expect(verify.is.valid).to.eql(true);
  };

  it('copy: copies source dir into staging dir (relative to cwd)', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'hello');

      const dir = { source: 'src', staging: 'stage' };
      await executeStaging([{ mode: 'copy', dir }], { cwd: tmp });

      const text = (await Fs.readText(`${tmp}/stage/a.txt`)).data!;
      expect(text).to.eql('hello');
      await assertDistJsonVerified(`${tmp}/stage`);
    });
  });

  it('copy: creates staging dir if missing', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'x');

      const dir = { source: 'src', staging: 'stage' };
      await executeStaging([{ mode: 'copy', dir }], { cwd: tmp });

      const res = await Fs.readText(`${tmp}/stage/a.txt`);
      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.data).to.eql('x');
      await assertDistJsonVerified(`${tmp}/stage`);
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
      await executeStaging([{ mode: 'build+copy', dir }], { cwd: tmp });

      const res = await Fs.readText(`${tmp}/stage/a.txt`);
      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.data).to.eql('built');
      await assertDistJsonVerified(`${tmp}/stage`);
    });
  });
});
