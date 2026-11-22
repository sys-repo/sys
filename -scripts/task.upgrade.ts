import { WorkspaceCli } from '@sys/workspace/cli';
import { PATH, syncPiAgentImport } from '../code/sys.driver/driver-pi/-scripts/-prep.u.ts';
import { c, Err, Fs, Process, Str, type t } from './common.ts';

type UpgradeResult =
  | { readonly kind: Exclude<t.WorkspaceCli.Result['kind'], 'apply'> }
  | { readonly kind: 'apply'; readonly options: Pick<t.WorkspaceCli.ResolvedOptions, 'deps'> };

type Lib = {
  run(input: t.WorkspaceCli.Input): Promise<UpgradeResult>;
  refresh(root: t.StringDir): Promise<void>;
  invoke: t.Process.Lib['inherit'];
};

/**
 * Only an apply to the repository's `deps.yaml` refreshes the Pi import pin
 * and installs dependencies at the repository root.
 */
export async function main(argv: readonly string[], lib: Lib = {
  run: WorkspaceCli.run,
  refresh: refreshDependencyMetadata,
  invoke: Process.inherit,
}) {
  const root = Fs.resolve(import.meta.dirname ?? '.', '..');
  return await lib.run({
    argv: ['upgrade', ...argv],
    async finalizeUpgrade(applied) {
      if (Fs.resolve(applied.input.deps) !== Fs.join(root, 'deps.yaml')) return;

      await lib.refresh(root);
      console.info('Installing dependencies');
      const install = await lib.invoke({ cmd: Deno.execPath(), args: ['install'], cwd: root });
      if (!install.success) {
        throw Err.std(
          `deno install failed (exit ${install.code}); dependency changes are retained.`,
        );
      }
      console.info();
      console.info(Str.dedent(`
        Dependencies installed. Workspace preparation and verification remain.

        Next: ${c.cyan('deno task prep')}
              ${c.gray('Refresh generated artifacts, including CI workflows.')}

        If you apply a bump, ${c.cyan('deno task bump')} runs post-bump preparation.
        It does not replace verification.
      `));
    },
  });
}

if (import.meta.main) await main(Deno.args);

async function refreshDependencyMetadata(root: t.StringDir): Promise<void> {
  await syncPiAgentImport(PATH.fromRoot(root));
}
