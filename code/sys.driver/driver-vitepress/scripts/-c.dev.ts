import { VitePress } from '@sys/driver-vitepress';
import { SCRIPT } from './u.ts';

const env = await SCRIPT.env();
const server = await VitePress.dev(env.inDir);
await server.listen();
