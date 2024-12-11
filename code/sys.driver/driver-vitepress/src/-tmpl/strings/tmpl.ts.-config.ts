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
import { parse } from 'yaml';

export const markdown = {
  config(md: MarkdownRenderer) {
    const rules = md.renderer.rules;

    // Store the original fence rule.
    const defaultFence =
      rules.fence ||
      function (tokens, idx, options, _env, self) {
        return self.renderToken(tokens, idx, options);
      };

    // Override the fence rule looking for YAML structures.
    rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];

      if (token.info.trim() === 'yaml') {
        const yaml = parse(token.content) || undefined;
        if (yaml?.component === 'Video') {
          const defaultHtml = defaultFence(tokens, idx, options, env, self);
          const src = yaml.src || '';
          let html = \`<Video src="\${src}"/>\`;
          if (yaml.debug) html = \`\${html}\\n\${defaultHtml}\`;
          return html;
        }
      }

      // No overriden matches found, return default rendering.
      return defaultFence(tokens, idx, options, env, self);
    };
  },
};


`;
