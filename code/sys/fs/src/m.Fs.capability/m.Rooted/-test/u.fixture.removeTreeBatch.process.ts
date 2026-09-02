import { Fs } from '../../../mod.ts';

const [root, ...paths] = Deno.args;
if (!root || paths.length < 2) {
  throw new Error('Expected Rooted batch holder root and at least two targets.');
}

const rooted = await Fs.Capability.Rooted.create({ root });
const admission = await rooted.admit(
  paths.map((path) => ({ kind: 'directory' as const, path })),
);
const acquired = await rooted.acquireLease(admission.targets, { mode: 'shared' });
if (acquired.kind !== 'acquired') throw new Error(`Batch holder failed: ${acquired.kind}`);

await Deno.stdout.write(new TextEncoder().encode('acquired\n'));
await Deno.stdin.read(new Uint8Array(1));
await acquired.lease.release();
