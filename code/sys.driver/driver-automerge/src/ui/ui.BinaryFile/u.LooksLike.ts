import { type t } from './common.ts';


export const LooksLike = {
  check(src: string) {
    const markdown = LooksLike.md(src);
    const yaml = LooksLike.yaml(src);

    return { yaml, markdown } as const;
  },

  /**
   * Naive heuristic for detecting YAML.
   *
   * Triggers when the text contains **any** of:
   *   • A document start marker (`---`)
   *   • A top‑level `key: value` pair
   *   • A list item beginning with `- `
   *
   * It is intentionally lightweight and is *not* a full YAML parser.
   */
  yaml(src: string) {
    const docStart = '^---\\s*$'; // document header
    const keyValue = '^\\s*[^\\s:#]+\\s*:\\s*.+'; // key: value
    const listItem = '^\\s*-\\s+.+'; // - item
    const yamlRegex = new RegExp(`${docStart}|${keyValue}|${listItem}`, 'm');
    return yamlRegex.test(src);
  },

  /**
   * Determine whether a string *appears* to contain Markdown syntax.
   *
   * Heuristics checked (any match returns `true`):
   *    - ATX‑style headings (e.g. `# Heading`)
   *    - Horizontal rules consisting of three or more dashes (`---`)
   *    - Emphasis markers such as `*italic*` or `**bold**`
   *    - Link / image bracket syntax (`[label](url)`)
   *    - Inline math fences of the form `$begin:math:text$ … $end:math:text$`
   *
   * This is intentionally lightweight; it does **not** fully parse Markdown.
   */
  md(src: string) {
    const headingPattern = '#{1,6}\\s';
    const hrPattern = '-{3,}';
    const emphasisPattern = '\\*{1,2}[^*\\n]+\\*{1,2}';
    const bracketPattern = '\\[`?[^`\\n]+`?\\]';
    const mathPattern = '\\$begin:math:text\\$[^)]*\\$end:math:text\\$';
    const mdRegex = new RegExp(
      [
        `^${headingPattern}`,
        `\\n${hrPattern}\\n`,
        emphasisPattern,
        bracketPattern,
        mathPattern,
      ].join('|'),
      'm',
    );
    return mdRegex.test(src);
  },
} as const;
