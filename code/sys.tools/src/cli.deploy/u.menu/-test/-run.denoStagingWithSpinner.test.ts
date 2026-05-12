import { describe, expect, Fs, it, Path } from '../../../-test.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';
import type { StagePlan } from '../../u.stage.ts';
import { runDenoStagingWithSpinner } from '../run.denoStagingWithSpinner.ts';
import { createDenoWorkspace } from './u.fixture.ts';

function denoPlanOf(args: {
  readonly cwd: string;
  readonly yaml: Extract<StagePlan, { readonly kind: 'deno' }>['yaml'];
}): Extract<StagePlan, { readonly kind: 'deno' }> {
  return {
    kind: 'deno',
    cwd: args.cwd,
    config: `${args.cwd}/deploy.yaml`,
    yaml: args.yaml,
    stagingRoot: String(args.yaml.staging?.dir ?? ''),
  } as Extract<StagePlan, { readonly kind: 'deno' }>;
}

describe('Staging: runDenoStagingWithSpinner', () => {
  it('stages a selected Deno workspace target into the caller-owned stage root', async () => {
    await withTmpDir(async (tmp) => {
      const workspace = await createDenoWorkspace(tmp);
      await withTmpDir(async (stageParent) => {
        const stageRoot = Path.join(stageParent, 'stage');

        const res = await runDenoStagingWithSpinner(denoPlanOf({
          cwd: tmp,
          yaml: {
            provider: { kind: 'deno', app: 'my-app' },
            source: { dir: '.' },
            staging: { dir: stageRoot, clear: true },
            mapping: { dir: { source: './code/apps/foo', staging: '.' } },
          },
        }));

        expect(res.ok).to.eql(true);
        expect(await Fs.exists(`${stageRoot}/deno.json`)).to.eql(true);
        expect(await Fs.exists(`${stageRoot}/code/apps/foo/dist/index.html`)).to.eql(true);
        expect(await Fs.exists(`${stageRoot}/entry.paths.ts`)).to.eql(true);
        expect((await Fs.readText(`${stageRoot}/entry.paths.ts`)).data).to.eql(
          `export const targetDir = './code/apps/foo';\n`,
        );
        expect(await Fs.exists(`${workspace}/code/apps/foo/dist/index.html`)).to.eql(true);
      }, { prefix: 'sys.tools.deploy.deno-stage.' });
    });
  });

  it('reports failure details when staging.dir resolves inside the workspace root', async () => {
    await withTmpDir(async (tmp) => {
      await createDenoWorkspace(tmp);

      const res = await runDenoStagingWithSpinner(denoPlanOf({
        cwd: tmp,
        yaml: {
          provider: { kind: 'deno', app: 'my-app' },
          source: { dir: '.' },
          staging: { dir: './stage', clear: true },
          mapping: { dir: { source: './code/apps/foo', staging: '.' } },
        },
      }));

      expect(res.ok).to.eql(false);
      expect(String('error' in res ? res.error : '')).to.include(
        `Deno staging.dir must resolve outside the workspace root '${tmp}'.`,
      );
    });
  });
});
