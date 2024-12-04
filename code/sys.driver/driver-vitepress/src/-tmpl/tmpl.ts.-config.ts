import type { t } from './common.ts';

export const config = (args: { srcDir?: t.StringDir } = {}) => {
  const { srcDir = './docs' } = args;
  return `
import { defineConfig } from 'vitepress';
import { sidebar } from '../src/nav.ts';

export default () => {
  return defineConfig({
    title: 'Untitled',
    description: 'See https://vitepress.dev for configuration options.',
    srcDir: '${srcDir}',
    themeConfig: { 
      sidebar,
      search: { provider: 'local' },
    },
  });
};
`.slice(1);
};
