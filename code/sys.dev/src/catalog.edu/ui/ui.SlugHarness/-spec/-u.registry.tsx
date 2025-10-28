import { makeRegistry } from '../mod.ts';
import { Sample } from './-ui.Sample.tsx';

export const registry = makeRegistry();

registry
  .register('foo', (ctx) => <Sample ctx={ctx} prefix={'👋'} />)
  .register('bar', (ctx) => <Sample ctx={ctx} prefix={'🌳'} />)
  .register('zoo', (ctx) => <Sample ctx={ctx} prefix={'🐷'} />);
