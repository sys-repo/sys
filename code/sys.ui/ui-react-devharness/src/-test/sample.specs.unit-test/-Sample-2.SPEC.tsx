import React from 'react';
import { Spec } from '../common.ts';
import { TestLog } from '../TestLog.ts';

export function Wrapper() {
  const log = TestLog.create();

  const root = Spec.describe('MySample', (e) => {
    e.it('init', (e) => {
      const ctx = Spec.ctx(e);

      ctx.subject
        .size([300, 140])
        .display('flex')
        .backgroundColor(1)
        .render(() => <div>Hello</div>);
      log.push(e, ctx);
    });

    // deno-lint-ignore require-await
    e.it('foo-1', async (e) => {
      const ctx = Spec.ctx(e);
      ctx.debug.row(() => <div>{`Hello Foo!`}</div>);
      log.push(e, ctx);
    });

    e.it('foo-2', (e) => {
      const ctx = Spec.ctx(e);
      log.push(e, ctx);
    });
  });

  return { root, log };
}

export const root = Wrapper().root;
export default root;
