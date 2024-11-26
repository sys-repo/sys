import { VitePress } from '../src/mod.ts';

const inDir = './.tmp/sample';
await VitePress.init({ inDir, force: true });
