import { Q } from '@sys/driver-quilibrium';
import { c, Path, Args } from '@sys/std-s';

type Args = {
  force?: boolean;
};
const args = Args.parse<Args>(Deno.args);
const force = args.force;

/**
 * Pull the latset Quilnrium release.
 */
const rootDir = Path.resolve('.');
const res = await Q.Release.pull({ rootDir, force });
console.log(c.yellow('─'.repeat(50)));
console.log(c.yellow('response:'), res);

Deno.exit(0);
