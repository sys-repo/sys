import { withTmpDir } from '../../-test/-fixtures.ts';
import { describe, expect, Fs, it } from '../../../-test.ts';
import { executeStaging } from '../u.staging.execute.ts';
import { Json } from '../../common.ts';

describe('Staging: executeStaging', () => {
  it('copy: copies source dir into staging dir (relative to cwd)', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'hello');

      const dir = { source: 'src', staging: 'stage' };
      await executeStaging([{ mode: 'copy', dir }], { cwd: tmp });

      const text = (await Fs.readText(`${tmp}/stage/a.txt`)).data!;
      expect(text).to.eql('hello');
    });
  });

  it('copy: creates staging dir if missing', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'x');

      const dir = { source: 'src', staging: 'stage' };
      await executeStaging([{ mode: 'copy', dir }], { cwd: tmp });

      // If the file exists at the staged path, the dir necessarily exists.
      const res = await Fs.readText(`${tmp}/stage/a.txt`);
      expect(res.ok).to.eql(true);
      expect(res.exists).to.eql(true);
      expect(res.data).to.eql('x');
    });
  });

  it('build+copy: runs build tasks then stages /dist output', async () => {
    await withTmpDir(async (tmp) => {
      const srcRoot = `${tmp}/src`;
      await Fs.ensureDir(srcRoot);

      // Minimal "package" that can satisfy: `deno -q task test && deno -q task build`
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
    });
  });
});
