/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Pkg, Vite } from '@sys/driver-vite';

const input = './src/-test/vite.sample-1/index.html';
const bundle = await Vite.build({ Pkg, input });
console.info(bundle.toString({ pad: true }));
