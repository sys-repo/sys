import { Vite } from '@sys/driver-vite';
import { pkg } from '../src/pkg.ts';

const input = './src/-test/index.html';
const bundle = await Vite.build({ pkg, input });
console.info(bundle.toString({ pad: true }));
