import { VitePress } from '@sys/driver-vitepress';

const server = await VitePress.dev();
await server.listen();
