import { makeRegistry } from '../mod.ts';
export const registry = makeRegistry();

registry
  .register('foo', (ctx) => <div>{`👋 view: ${ctx.view}`}</div>)
  .register('bar', (ctx) => <div>{`🌳 view: ${ctx.view}`}</div>)
  .register('zoo', (ctx) => <div>{`🐷 view: ${ctx.view}`}</div>);
