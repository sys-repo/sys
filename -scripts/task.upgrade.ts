import { WorkspaceCli } from '@sys/workspace/cli';
import { PATH, syncPiAgentImport } from '../code/sys.driver/driver-pi/-scripts/-prep.u.ts';
import { Fs, type t } from './common.ts';

type UpgradeResult =
  | { readonly kind: Exclude<t.WorkspaceCli.Result['kind'], 'apply'> }
  | { readonly kind: 'apply'; readonly options: Pick<t.WorkspaceCli.ResolvedOptions, 'deps'> };

type Lib = {
  run(input: t.WorkspaceCli.Input): Promise<UpgradeResult>;
  refresh(root: t.StringDir): Promise<void>;
};

/**
 * Upgrade workspace dependencies and refresh derived repository metadata.
 */
export async function main(argv: readonly string[], lib: Lib = {
  run: WorkspaceCli.run,
  refresh: refreshDependencyMetadata,
}) {
  const root = Fs.resolve(import.meta.dirname ?? '.', '..');
  const result = await lib.run({ argv: ['upgrade', ...argv] });
  if (result.kind === 'apply' && Fs.resolve(result.options.deps) === Fs.join(root, 'deps.yaml')) {
    await lib.refresh(root);
  }
  return result;
}

if (import.meta.main) await main(Deno.args);

/**
 * Repository composition; each package owns its metadata writer.
 */
async function refreshDependencyMetadata(root: t.StringDir): Promise<void> {
  await syncPiAgentImport(PATH.fromRoot(root));
}
