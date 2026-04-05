import { Fs } from '@sys/fs';
import { type t, SlcDataCli as Cli } from '@tdb/slc-data/cli';
import { runStageProfile } from '../src/fs/m.cli/u.stage.ts';

/**
 * WARNING:
 * Temporary canned bridge to the local staging profile.
 * TODO: remove once the interactive/non-interactive CLI flow fully replaces this task.
 */
const cwd = Deno.cwd() as t.StringDir;
const profile = 'venture-examples' as t.StringId;
const path = Cli.StageProfile.path(cwd, profile);
const target = Cli.StageProfile.fs.target(cwd, profile);
const exists = (name: string, dir = 'manifests') => Fs.exists(Fs.join(target, dir, name));
const ensure = async (name: string, dir = 'manifests') => {
  if (!(await exists(name, dir))) throw new Error(`missing ${name}`);
};

const result = await runStageProfile({ cwd, path });
await ensure('slug-tree.venture-examples.json');
await ensure('slug-tree.venture-examples.yaml');
await ensure('slug-tree.venture-examples.assets.json');
console.info(result);
