import { Fs } from '@sys/fs';
import { type t, SlcDataCli as Cli } from '@tdb/slc-data/cli';

/**
 * Temporary fixed-profile bridge for sample staging.
 * TODO: replace with the non-interactive CLI path.
 */
export async function run(args: {
  cwd?: t.StringDir;
  profile?: t.StringId;
} = {}) {
  const cwd = args.cwd ?? Deno.cwd() as t.StringDir;
  const profile = args.profile ?? 'venture-examples' as t.StringId;
  const target = Cli.StageProfile.fs.target(cwd, profile);
  const exists = (name: string, dir = 'manifests') => Fs.exists(Fs.join(target, dir, name));
  const ensure = async (name: string, dir = 'manifests') => {
    if (!(await exists(name, dir))) throw new Error(`missing ${name}`);
  };

  const result = await Cli.StageProfile.stage({ cwd, profile });
  await ensure(`slug-tree.${profile}.json`);
  await ensure(`slug-tree.${profile}.yaml`);
  await ensure(`slug-tree.${profile}.assets.json`);
  console.info(result);
  return result;
}

if (import.meta.main) {
  await run();
}
