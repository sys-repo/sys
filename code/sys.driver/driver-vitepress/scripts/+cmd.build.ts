import { VitePress } from '@sys/driver-vitepress';
import { pkg } from '../src/pkg.ts';

const inDir = './src/-test/vitepress.sample-1';
const outDir = './dist';
const res = await VitePress.build({ inDir, outDir, pkg });
console.info(res.toString({ pad: true }));
