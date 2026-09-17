import { DenoDeploy } from '@sys/driver-deno/cloud';
import { Fs, ROOT } from './common.ts';

/**
 * Staging rebuilds the UI.
 * Freeze the candidate after this call, not before it.
 */
const stage = await DenoDeploy.stage({ target: { dir: ROOT } });

await Fs.writeJson(Fs.join(ROOT, '.tmp', 'stage.json'), {
  target: stage.target,
  workspace: { dir: stage.workspace.dir },
  root: stage.root,
  entry: stage.entry,
}, { throw: true });

console.info('');
console.info(`Retained stage: ${stage.root}`);
console.info(`Entry: ${stage.entry}`);
