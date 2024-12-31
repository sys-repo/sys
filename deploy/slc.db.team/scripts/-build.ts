import { Fs } from '@sys/fs';
import { Vite } from '@sys/driver-vite';
import { pkg } from '../src/pkg.ts';

const input = './src/-test/index.html';
const bundle = await Vite.build({ pkg, input });
console.info(bundle.toString({ pad: true }));

/**
 * Ensure the {manifest.json} file exists.
 */
const from = Fs.resolve('./src/manifest.json');
const to = Fs.resolve('./dist/manifest.json');
await Fs.copy(from, to, { throw: true });
