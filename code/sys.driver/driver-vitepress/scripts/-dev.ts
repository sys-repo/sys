import { VitePress } from '@sys/driver-vitepress';
import { pkg } from '../src/pkg.ts';

const server = await VitePress.dev({ pkg });
await server.listen();
