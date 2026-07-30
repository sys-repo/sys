import { Str } from '../common.ts';

export const codeBlocks = {
  label: 'sample: code blocks',
  value: Str.dedent(`
    Code blocks retain native semantics and neutral styling.

    ---

    Backtick fence:

    \`\`\`ts
    const answer: number = 42;
    \`\`\`

    ---

    Tilde fence:

    ~~~text
    plain text
      preserved indentation
    ~~~
  `),
} as const;
