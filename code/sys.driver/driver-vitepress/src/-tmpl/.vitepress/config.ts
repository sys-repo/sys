import type { ConfigEnv } from 'vite';

import { defineConfig } from 'vitepress';
import { Config } from '../src/config.ts';
import { sidebar } from '../src/nav.ts';
import { getAliases } from './config.aliases.ts';
import { markdown } from './config.markdown.ts';

export default async (env: ConfigEnv) => {
  const { title, description } = Config;
  const alias = await getAliases();

  return defineConfig({
    title,
    description,
    base: '/',
    srcDir: '<SRC_DIR>',
    markdown,
    themeConfig: { sidebar, search: { provider: 'local' } },
    vite: {
      plugins: [],
      resolve: { alias },
    },
  });
};
