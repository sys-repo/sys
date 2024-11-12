/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Vite } from '@sys/driver-vite';
import { pkg } from '../src/pkg.ts';

const input = './src/-test/vite.sample-2/index.html';
const bundle = await Vite.build({ pkg, input });

console.log(`-------------------------------------------`);
console.info(bundle.toString({ pad: true }));
