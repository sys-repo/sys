import { VitePress } from '@sys/driver-vitepress';

const path = 'src/-test/vitepress.sample-1';
const res = await VitePress.build({ path });

