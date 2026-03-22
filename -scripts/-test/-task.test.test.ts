import { describe, expect, it } from '@sys/testing/server';
import { targets } from '../task.test.ts';

describe('scripts/task.test', () => {
  it('includes root script specs ahead of workspace module tests', () => {
    const res = targets(['code/sys/fs', 'code/sys/ui']);

    expect(res).to.eql([
      {
        path: './-scripts/-test',
        command: 'deno test -P=test --trace-leaks ./-scripts/-test/*.ts',
        label: 'root',
      },
      {
        path: 'code/sys/fs',
        command: 'deno task test',
        label: 'code/sys/fs',
      },
      {
        path: 'code/sys/ui',
        command: 'deno task test',
        label: 'code/sys/ui',
      },
    ]);
  });
});
