import { VitePress } from '@sys/driver-vitepress';

const path = 'src/-test/vitepress.sample-1';

const server = await VitePress.dev({ path });
await server.listen();
