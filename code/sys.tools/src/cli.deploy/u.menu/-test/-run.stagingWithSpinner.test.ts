import { describe, expect, Fs, it, Str, type t } from '../../../-test.ts';
import { withTmpDir } from '../../-test/u.fixture.ts';
import type { StagePlan } from '../../u.stage.ts';
import { runStagingWithSpinner } from '../run.stagingWithSpinner.ts';

function stagePlanOf(args: {
  cwd: string;
  mappings: t.DeployTool.Staging.Mapping[];
  stagingRoot: string;
}): Extract<StagePlan, { kind: 'mappings' }> {
  return {
    kind: 'mappings',
    cwd: args.cwd,
    config: `${args.cwd}/deploy.yaml`,
    stagingRoot: `${args.cwd}/${args.stagingRoot}`,
    stage: {
      cwd: args.cwd,
      mappings: args.mappings,
      stagingRoot: args.stagingRoot,
    },
  } as Extract<StagePlan, { kind: 'mappings' }>;
}

describe('Staging: runStagingWithSpinner', () => {
  it('reports a verified deterministic root and removes nested manifests', async () => {
    await withTmpDir(async (tmp) => {
      await Fs.ensureDir(`${tmp}/src`);
      await Fs.write(`${tmp}/src/a.txt`, 'a');
      await Fs.ensureDir(`${tmp}/stage/stale`);
      await Fs.write(`${tmp}/stage/stale/old.txt`, 'old');

      const result = await runStagingWithSpinner(stagePlanOf({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [{ mode: 'copy', dir: { source: 'src', staging: 'nested/site' } }],
      }));

      expect(result.ok).to.eql(true);
      expect(await Fs.exists(`${tmp}/stage/stale/old.txt`)).to.eql(false);
      expect(await Fs.exists(`${tmp}/stage/dist.json`)).to.eql(true);
      expect(await Fs.exists(`${tmp}/stage/nested/dist.json`)).to.eql(false);
      expect(await Fs.exists(`${tmp}/stage/nested/site/dist.json`)).to.eql(false);
    });
  });

  it('preserves custom intermediate index bytes', async () => {
    await withTmpDir(async (tmp) => {
      const custom = '<html>custom releases index</html>\n';
      await Fs.ensureDir(`${tmp}/src/releases`);
      await Fs.write(`${tmp}/src/releases/index.html`, custom);
      await Fs.write(`${tmp}/src/releases/a.txt`, 'a');

      const result = await runStagingWithSpinner(stagePlanOf({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [{ mode: 'copy', dir: { source: 'src/releases', staging: 'releases' } }],
      }));

      expect(result.ok).to.eql(true);
      expect((await Fs.readText(`${tmp}/stage/releases/index.html`)).data).to.eql(custom);
    });
  });

  it('build+copy root reset removes stale compiled files between generations', async () => {
    await withTmpDir(async (tmp) => {
      const source = `${tmp}/src`;
      await Fs.ensureDir(source);
      await Fs.write(`${source}/mode.txt`, 'v1');
      await Fs.write(
        `${source}/-build.ts`,
        Str.dedent(`
          await Deno.remove('dist', { recursive: true }).catch(() => undefined);
          await Deno.mkdir('dist', { recursive: true });
          const mode = (await Deno.readTextFile('./mode.txt')).trim();
          await Deno.writeTextFile(\`dist/chunk-\${mode}.js\`, mode);
        `),
      );
      await Fs.write(
        `${source}/deno.json`,
        Str.dedent(`
          {
            "name": "tmp-staging-build",
            "version": "0.0.0",
            "tasks": {
              "test": "deno eval \\"Deno.exit(0)\\"",
              "build": "deno run -A ./-build.ts"
            }
          }
        `),
      );

      const plan = stagePlanOf({
        cwd: tmp,
        stagingRoot: 'stage',
        mappings: [{ mode: 'build+copy', dir: { source: 'src', staging: '.' } }],
      });
      expect((await runStagingWithSpinner(plan)).ok).to.eql(true);
      expect(await Fs.exists(`${tmp}/stage/chunk-v1.js`)).to.eql(true);

      await Fs.write(`${source}/mode.txt`, 'v2');
      expect((await runStagingWithSpinner(plan)).ok).to.eql(true);
      expect(await Fs.exists(`${tmp}/stage/chunk-v1.js`)).to.eql(false);
      expect(await Fs.exists(`${tmp}/stage/chunk-v2.js`)).to.eql(true);
    });
  });
});
