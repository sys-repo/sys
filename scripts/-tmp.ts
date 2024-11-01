import { c, Cli, Env, Fs, Path, Hash } from '@sys/std-s';

// const match = await Fs.glob().find('code/**/-test.*');
// console.log('match', match);

/**
 * Watch an Obsidian directory.
 */
const dir = '/Users/phil/Documents/Notes/phil';
const m = await Hash.Dir.compute(dir);

console.log('m', m);
console.log(`-------------------------------------------`);

/**
 * Finish up.
 */
Deno.exit(0);
