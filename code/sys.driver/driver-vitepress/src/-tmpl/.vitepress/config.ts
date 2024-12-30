import { defineConfig } from 'vitepress';
import { Config } from '../src/config.ts';
import { sidebar } from '../src/nav.ts';
import { markdown } from './config.markdown.ts';

export default () => {
  const { title, description } = Config;
  return defineConfig({
    title,
    description,
    srcDir: '<SRC_DIR>',
    markdown,
    themeConfig: {
      sidebar,
      search: { provider: 'local' },
    },
  });
};
