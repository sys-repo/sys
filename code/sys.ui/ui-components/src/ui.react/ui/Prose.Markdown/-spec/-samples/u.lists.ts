import { Str } from '../common.ts';

export const lists = {
  label: 'sample: lists',
  value: Str.dedent(`
    Ordered steps:

    1. Press \`Tab\`.
    2. Press \`Enter\`.

    ---

    Unordered notes:

    - preserves list text
    - keeps \`inlineCode\` semantic

    ---

    Task states:

    - [x] completed task
    - [ ] pending task
  `),
} as const;
