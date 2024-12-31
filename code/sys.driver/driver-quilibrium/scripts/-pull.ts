import { Q } from '@sys/driver-quilibrium';
import { Args } from '@sys/std-s';
import { c } from '@sys/cli';
import { Path } from '@sys/fs';

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
console.log();
console.log(c.yellow('─'.repeat(50)));
console.log(c.yellow('sample response:'), res);

Deno.exit(0);
