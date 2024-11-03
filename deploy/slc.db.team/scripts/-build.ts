import { Fs } from '@sys/std-s';
import { Vite } from '@sys/driver-vite';
import { pkg } from '../src/pkg.ts';

const input = './src/-test/index.html';
const bundle = await Vite.build({ pkg, input });
console.info(bundle.toString({ pad: true }));
const from = Fs.resolve('./src/manifest.json');
const to = Fs.resolve('./dist/manifest.json');
await Fs.ensureDir(Fs.dirname(to));
await Deno.copyFile(from, to);
