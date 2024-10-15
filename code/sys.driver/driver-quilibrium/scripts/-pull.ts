import { Q } from '@sys/driver-quilibrium';
import { c, Path } from '@sys/std-s';

/**
 * Pull the latset Quilnrium release.
 */
const rootDir = Path.resolve('.');
const res = await Q.Release.pull({ rootDir });

console.log(`⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🐚👋🧠⚠️ 💥👁️💡─• ↑↓←→`);
console.log(c.magenta('-'.repeat(50)));
console.log('dev/response:', res);

Deno.exit(0);
