import { Fs } from '../../../mod.ts';
import type { t } from '../common.ts';

const [root, path, mode] = Deno.args;
if (!root || !path || !(mode === 'shared' || mode === 'exclusive')) {
  throw new Error('Expected Rooted lease child root, target, and mode.');
}

const rooted = await Fs.Capability.Rooted.create({ root });
const admission = await rooted.Target.admit([{ kind: 'directory', path }]);
const target = admission.targets[0] as t.FsRooted.Target<'directory'>;
const result = await rooted.Lease.acquire([target], { mode });
if (result.kind !== 'acquired') throw new Error(`Lease child failed: ${result.kind}`);

await Deno.stdout.write(new TextEncoder().encode('acquired\n'));
await Deno.stdin.read(new Uint8Array(1));
await result.lease.release();
