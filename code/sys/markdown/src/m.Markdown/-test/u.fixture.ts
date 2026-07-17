import { expect, Str, type t } from '../../-test.ts';

export const markdown = (text: string) => `${Str.dedent(text)}\n` as t.StringMarkdown;

export const Sample = {
  commonmarkDocument: markdown(`
    # Hello

    - one

    \`\`\`ts
    const x = 1;
    \`\`\`

    [example](https://example.com)
  `),
  gfmTable: markdown(`
    | A | B |
    | - | - |
    | 1 | 2 |
  `),
  gfmTableAndTaskList: markdown(`
    | A | B |
    | - | - |
    | 1 | 2 |

    - [x] done
  `),
  headingAndTaskList: markdown(`
    # Hello

    - [x] done
  `),
} as const;

export const Forbidden = {
  fs: ['@sys/fs'],
  browserAndUi: [
    '@sys/driver-vite',
    '@sys/ui-components',
    '@sys/ui-css',
    '@sys/ui-dev',
    '@sys/ui-dom',
    '@sys/ui-react',
    'react',
  ],
} as const;

export function requireData<T>(res: t.Markdown.Ok<T> | t.Markdown.Err): T {
  expect(res.error).to.eql(undefined);
  if ('data' in res && res.data !== undefined) return res.data;
  throw new Error('Expected Markdown result data.');
}

export function invalidAst(): t.Markdown.Ast {
  return { type: 'root', children: [{ type: 'not-real' }] } as unknown as t.Markdown.Ast;
}
