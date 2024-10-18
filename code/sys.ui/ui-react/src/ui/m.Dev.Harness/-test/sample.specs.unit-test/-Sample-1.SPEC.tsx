import { Spec } from '../common.ts';

export const root = Spec.describe('MySample', (e) => {
  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    ctx.subject
      .size([300, 140])
      .display('flex')
      .backgroundColor(1)
      .render(() => {
        const env = ctx.env;
        const message = typeof env?.msg === 'string' ? env.msg : 'Hello Subject';
        return <div>{message}</div>;
      });
  });

  // deno-lint-ignore require-await
  e.it('foo', async (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(() => <div>{`Hello Row!`}</div>);
  });
});

export default root;
