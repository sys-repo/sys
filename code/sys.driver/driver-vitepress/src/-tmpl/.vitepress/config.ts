import type { ConfigEnv } from 'vite';

import deno from '@deno/vite-plugin';
import react from '@vitejs/plugin-react-swc';

import { defineConfig } from 'vitepress';
import { Config } from '../src/config.ts';
import { sidebar } from '../src/nav.ts';
import { getAliases } from './config.aliases.ts';
import { markdown } from './config.markdown.ts';

export default async (env: ConfigEnv) => {
  const { title, description } = Config;

  return defineConfig({
    title,
    description,
    srcDir: '<SRC_DIR>',
    markdown,
    themeConfig: { sidebar, search: { provider: 'local' } },
    vite: {
      plugins: [deno() as any, react()],
      resolve: {
        alias: await getAliases(),
      },
    },
  });
};
