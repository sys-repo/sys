import { VitePress } from '@sys/driver-vitepress';
import { TMP, pkg } from './u.ts';

const env = await TMP.env();
const { inDir } = env;

const server = await VitePress.dev({ inDir, pkg });
await server.listen();
