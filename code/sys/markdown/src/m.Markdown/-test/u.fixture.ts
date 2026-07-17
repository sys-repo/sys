import { type t, expect } from '../../-test.ts';

export const Sample = {
  commonmarkDocument: '# Hello\n\n- one\n\n```ts\nconst x = 1;\n```\n\n[example](https://example.com)\n',
  gfmTable: '| A | B |\n| - | - |\n| 1 | 2 |\n',
  gfmTableAndTaskList: '| A | B |\n| - | - |\n| 1 | 2 |\n\n- [x] done\n',
  headingAndTaskList: '# Hello\n\n- [x] done\n',
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
