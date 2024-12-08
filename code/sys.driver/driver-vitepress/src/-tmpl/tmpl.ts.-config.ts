import type { t } from './common.ts';

export const vitepressConfig = (args: { srcDir?: t.StringDir } = {}) => {
  const { srcDir = './docs' } = args;
  return `
import { defineConfig } from 'vitepress';
import { Config } from '../src/config.ts';
import { sidebar } from '../src/nav.ts';

export default () => {
  return defineConfig({
    title: Config.title,
    description: Config.description,
    srcDir: '${srcDir}',
    themeConfig: { 
      sidebar,
      search: { provider: 'local' },
    },
  });
};
`.slice(1);
};

export const config = `
export const Config = {
  title: 'Untitled',
  description: '', // Rendered in the head of each page, useful for SEO.
} as const;
`;
