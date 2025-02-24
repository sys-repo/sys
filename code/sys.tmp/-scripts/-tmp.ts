import { build, emptyDir } from '@deno/dnt';
// console.log('tmp', tmp);

/**
 * https://jsr.io/@deno/dnt
 */

console.log('build:', build);

await emptyDir('./npm');
