import { VitePress } from '@sys/driver-vitepress';
import { pkg } from '../src/pkg.ts';
import { SCRIPT } from './u.ts';

const env = await SCRIPT.env();
const { inDir, outDir } = env;

const res = await VitePress.build({ inDir, outDir, pkg });
console.info(res.toString({ pad: true }));
