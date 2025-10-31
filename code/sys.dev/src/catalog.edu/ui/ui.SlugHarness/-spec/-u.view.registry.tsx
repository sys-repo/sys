import { Log } from '../common.ts';
import { makeRegistry } from '../mod.ts';
import { Sample } from './-ui.Sample.tsx';
import { Tree } from './-ui.Tree.tsx';

const logInfo = Log.category('view.registry', { timestamp: null });

export const registry = makeRegistry();

registry
  .register('foo', (ctx) => <Sample ctx={ctx} prefix={'👋'} />)
  .register('bar', (ctx) => <Sample ctx={ctx} prefix={'🌳'} />)
  .register('programme', (ctx) => {

    return <Tree ctx={ctx} theme={ctx.theme} />;
  });
