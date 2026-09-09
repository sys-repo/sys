import { Str } from '../common.ts';

export const intro = {
  label: 'sample: intro',
  value: Str.dedent(`
    Use \`inline code\` for compact tokens.

    - Markdown text parses through \`@sys/markdown\`.
    - Render overrides can replace \`inlineCode\` with a component.
  `),
} as const;
