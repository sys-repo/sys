/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Vite } from '@sys/driver-vite';
import { Pkg } from '../src/pkg.ts';

const input = './src/-test/index.html';
const bundle = await Vite.build({ Pkg, input });
console.info(bundle.toString({ pad: true }));
