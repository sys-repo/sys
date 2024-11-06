import { Vite } from '@sys/driver-vite';
import { pkg } from '@sys/driver-automerge';

const input = './src/-test/ui.sample/index.html';
const bundle = await Vite.build({ pkg, input });
console.info(bundle.toString({ pad: true }));
