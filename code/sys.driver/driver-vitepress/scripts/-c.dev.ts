import { VitePress } from '@sys/driver-vitepress';
import { TMP } from './u.ts';

const env = await TMP.env();
const server = await VitePress.dev(env.inDir);
await server.listen();
