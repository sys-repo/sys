import type { t } from '../../-test.ts';
import {
  Forbidden as MarkdownForbidden,
  markdown,
  requireData,
  Sample as MarkdownSample,
} from '../../m.Markdown/-test/u.fixture.ts';

export { requireData };

export const Sample = {
  noFrontmatter: MarkdownSample.headingAndTaskList,
  yamlFrontmatter: markdown(`
    ---
    title: Hello
    tags:
      - markdown
      - sys
    ---
    # Hello

    - [x] done
  `),
  yamlFrontmatterWithTable: `${markdown(`
    ---
    title: Table
    ---
  `)}${MarkdownSample.gfmTable}` as t.StringMarkdown,
  invalidYamlFrontmatter: markdown(`
    ---
    title: [
    ---
    # Hello
  `),
  unclosedYamlFrontmatter: markdown(`
    ---
    title: Missing close
    # Hello
  `),
} as const;

export const Forbidden = {
  fs: MarkdownForbidden.fs,
  browserAndUi: MarkdownForbidden.browserAndUi,
  html: ['hast-util-sanitize', 'hast-util-to-html', 'mdast-util-to-hast', 'happy-dom'],
} as const;

export function frontmatterEntry() {
  return new URL('../mod.ts', import.meta.url).pathname;
}
