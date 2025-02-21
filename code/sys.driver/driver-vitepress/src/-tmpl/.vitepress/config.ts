import type { ConfigEnv } from 'vite';

import { defineConfig } from 'vitepress';
import { Config } from '../src/config.ts';
import { sidebar } from '../src/nav.ts';
import { getAliases } from './config.alias.ts';
import { markdown } from './config.markdown.ts';

export default async (env: ConfigEnv) => {
  const { title, description } = Config;
  const alias = (await getAliases()) as any; // NB: type-hack ("vitepress" vs. "vite" fighting).

  return defineConfig({
    title,
    description,
    srcDir: '<SRC_DIR>',
    markdown,
    themeConfig: { sidebar, search: { provider: 'local' } },
    vite: { resolve: { alias }, plugins: [] },
  });
};
