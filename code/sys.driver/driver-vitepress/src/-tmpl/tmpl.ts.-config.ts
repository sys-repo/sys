import type { t } from './common.ts';

export const vitepressConfig = (args: { srcDir?: t.StringDir } = {}) => {
  const { srcDir = './docs' } = args;
  return `
import { defineConfig } from 'vitepress';
import { Config } from '../src/config.ts';
import { sidebar } from '../src/nav.ts';
import { markdown } from './config.markdown.ts';

export default () => {
  const { title, description } = Config;
  return defineConfig({
    title,
    description,
    srcDir: '${srcDir}',
    markdown,
    themeConfig: { 
      sidebar,
      search: { provider: 'local' },
    },
  });
};
`.slice(1);
};

export const userConfig = `
export const Config = {
  title: 'Untitled',
  description: '', // Rendered in the head of each page, useful for SEO.
} as const;
`;

export const markdownConfig = `
import type { MarkdownRenderer } from 'vitepress';

export const markdown = {
  config(md: MarkdownRenderer) {
  },
};
`;
