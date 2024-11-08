import { VitePress } from '@sys/driver-vitepress';

const server = await VitePress.dev('src/-test/vitepress.sample-1');
await server.listen();
