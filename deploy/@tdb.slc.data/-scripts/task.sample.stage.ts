import type { t } from '../src/common.ts';
import { Fs } from '@sys/fs';
import { StageProfileFs } from '../src/fs/m.cli/u.fs.ts';
import { runStageProfile } from '../src/fs/m.cli/u.stage.ts';

/**
 * WARNING:
 * Temporary canned bridge to the local staging profile.
 * TODO: remove once the interactive/non-interactive CLI flow fully replaces this task.
 */
const cwd = Deno.cwd() as t.StringDir;
const profile = 'venture-examples' as t.StringId;
const path = Fs.join(cwd, StageProfileFs.dir, `${profile}${StageProfileFs.ext}`);
const target = StageProfileFs.target(cwd, profile);
const exists = (name: string, dir = 'manifests') => Fs.exists(Fs.join(target, dir, name));
const ensure = async (name: string, dir = 'manifests') => {
  if (!(await exists(name, dir))) throw new Error(`missing ${name}`);
};

const result = await runStageProfile({ cwd, path });
await ensure('slug-tree.venture-examples.json');
await ensure('slug-tree.venture-examples.yaml');
await ensure('slug-tree.venture-examples.assets.json');
console.info(result);
