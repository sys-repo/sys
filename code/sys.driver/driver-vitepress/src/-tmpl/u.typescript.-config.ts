import type { t } from './common.ts';

export const config = (args: { srcDir?: t.StringDir } = {}) => {
  const { srcDir = './docs' } = args;
  return `
import { defineConfig } from 'vitepress';
import { sidebar } from '../pkg.nav.ts';

export default () => {
  return defineConfig({
    title: 'My Sample',
    description: 'See https://vitepress.dev for configuration options.',
    srcDir: '${srcDir}',
    themeConfig: { 
      sidebar,
      smoothScroll: true,
    },
  });
};
`.slice(1);
};
