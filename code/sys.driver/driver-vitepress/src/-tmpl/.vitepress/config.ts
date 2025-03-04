import type { ConfigEnv } from 'vite';

import { ViteConfig } from '@sys/driver-vite';
import { defineConfig } from 'vitepress';

import { Config } from '../src/config.ts';
import { sidebar } from '../src/nav.ts';
import { markdown } from './config.markdown.ts';

export default async (env: ConfigEnv) => {
  const { title, description } = Config;
  const ws = await ViteConfig.workspace();
  const alias = ws.aliases;

  return defineConfig({
    title,
    description,
    base: '/',
    srcDir: './docs',
    markdown,
    themeConfig: { sidebar, search: { provider: 'local' } },
    vite: {
      plugins: [],
      resolve: { alias },
    },
  });
};
