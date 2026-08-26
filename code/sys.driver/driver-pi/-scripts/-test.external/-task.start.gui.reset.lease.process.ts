import { Is } from '@sys/std/is';

import { Fs, Process, type t } from '../common.ts';

const [workspaceRoot, targetPath, readiness = 'normal'] = Deno.args;
if (
  !Is.str(workspaceRoot) || !Is.str(targetPath) ||
  !(readiness === 'normal' || readiness === 'fragmented' || readiness === 'silent')
) {
  throw new Error('Expected reset lease workspace root, target path, and readiness mode.');
}

const root = Fs.join(workspaceRoot, '.pi/@sys/dist');
const rooted = await Fs.Capability.Rooted.create({ root, create: false });
const targetInput: t.StringPath = targetPath;
const admission = await rooted.admit([{
  kind: 'directory',
  path: targetInput,
}]);
const target = admission.targets[0];
const acquired = await rooted.acquireLease([target], { mode: 'shared', wait: false });
if (acquired.kind !== 'acquired') {
  throw new Error(`Reset lease holder failed: ${acquired.kind}.`);
}

if (readiness === 'normal') {
  Process.stdout.write(`${Process.Signal.ready}\n`);
} else if (readiness === 'fragmented') {
  Process.stdout.write('PROCESS_');
  await readControlByte();
  Process.stdout.write('READY\n');
}

await readControlByte();
await acquired.lease.release();

// @sys/process does not currently expose a host-process stdin capability.
async function readControlByte(): Promise<void> {
  const count = await Deno.stdin.read(new Uint8Array(1));
  if (count !== 1) throw new Error('Reset lease holder lost its parent control pipe.');
}
