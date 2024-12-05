import type { t } from './common.ts';

export const config = (args: { srcDir?: t.StringDir } = {}) => {
  const { srcDir = './docs' } = args;

  return `
import { defineConfig } from 'vitepress';
import { sidebar } from '../src/nav.ts';

export default () => {
  return defineConfig({
    title: 'Untitled',
    description: '', // Rendered in the head of each page, useful for SEO.
    srcDir: '${srcDir}',
    themeConfig: { 
      sidebar,
      search: { provider: 'local' },
    },
  });
};
`.slice(1);
};
