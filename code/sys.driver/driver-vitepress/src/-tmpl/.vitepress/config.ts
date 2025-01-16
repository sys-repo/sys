import { defineConfig } from 'vitepress';
import { Config } from '../src/config.ts';
import { sidebar } from '../src/nav.ts';
import { markdown } from './config.markdown.ts';

import { ViteConfig } from '@sys/driver-vite';

export default async () => {
  const { title, description } = Config;
  const ws = await ViteConfig.workspace({});
  const alias = ws.aliases;
  return defineConfig({
    title,
    description,
    srcDir: '<SRC_DIR>',
    markdown,
    themeConfig: { sidebar, search: { provider: 'local' } },
    vite: { resolve: { alias } },
  });
};
