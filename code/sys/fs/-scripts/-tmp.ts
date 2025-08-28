import { Env, Fs } from '@sys/fs';

/**
 * Turn current folder into Deno project (in VSCode).
 */
await Env.init();

/**
 * 🌳
 */
const tree = await Fs.Fmt.treeFromDir();
console.log(tree);
