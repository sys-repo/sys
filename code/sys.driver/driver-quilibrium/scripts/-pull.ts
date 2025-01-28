import { c } from '@sys/cli';
import { Q } from '@sys/driver-quilibrium';
import { Path } from '@sys/fs';
import { Args } from '@sys/std';

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
