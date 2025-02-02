import type { ConfigEnv } from 'vite';
import { defineConfig } from 'vitepress';
import { Config } from '../src/config.ts';
import { sidebar } from '../src/nav.ts';
import { markdown } from './config.markdown.ts';

import { ViteConfig } from '@sys/driver-vite';

import { dynamicNpmAliasPlugin } from './tmp.ts';

export default async (env: ConfigEnv) => {
  const { title, description } = Config;
  const ws = await ViteConfig.workspace({});
  const alias = [
    ...ws.aliases,

    /**
     * TODO 🐷 - generalize into `ViteConfig.workspace() method`
     */

    // Alias for 'npm:react@<version>' to 'react'
    // {
    //   find: /^npm:react@(?:\d+\.\d+\.\d+)(?:-[\w.]+)?$/,
    //   replacement: 'react',
    // },
    // // Alias for 'npm:react-dom@<version>' to 'react-dom'
    // {
    //   find: /^npm:react-dom@(?:\d+\.\d+\.\d+)(?:-[\w.]+)?$/,
    //   replacement: 'react-dom',
    // },
  ];

  // const p = dynamicNpmAliasPlugin()

  return defineConfig({
    title,
    description,
    srcDir: '<SRC_DIR>',
    markdown,
    themeConfig: { sidebar, search: { provider: 'local' } },
    vite: {
      resolve: { alias },
      plugins: [dynamicNpmAliasPlugin()],
    },
  });
};
