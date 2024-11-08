export const gitignore = `
cache/
dist/
`.slice(1);

export const config = `
import { defineConfig } from 'vitepress';

export default () => {
  return defineConfig({
    title: 'My Sample',
    description: 'See https://vitepress.dev/ for configuration options.',
  });
};
`.slice(1);

export const Tmpl = { gitignore, config };
