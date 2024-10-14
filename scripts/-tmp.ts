import { c, Cli, Env, Fs, Path } from '@sys/std-s';
import { Q } from './-tmp.quilibrium.ts';

// const match = await Fs.glob().find('code/**/-test.*');
// console.log('match', match);

/**
 * TODO 🐷 move to module: drivers → @sys/driver-quilibrium
 */

/**
 * Quilbrium tools.
 */
await Q.Release.pull();

/**
 * Finish up.
 */
Deno.exit(0);
