/**
 * Run in a child-process (hence the `-allow-run` requirement).
 */
import { Pkg, ViteProcess } from '@sys/driver-vite';

const input = './src/-test/vite.sample-2/index.html';
const bundle = await ViteProcess.build({ Pkg, input });
console.info(bundle.toString({ pad: true }));
