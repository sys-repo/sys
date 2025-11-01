import { Color, Crdt, Lens, Log, Obj } from '../common.ts';
import { makeRegistry } from '../mod.ts';
import { Sample } from './-ui.Sample.tsx';
import { Tree } from './-ui.Tree.tsx';

const logInfo = Log.logger('view.registry', { timestamp: null, prefixColor: Color.MAGENTA });

export const registry = makeRegistry();

registry
  .register('foo', (ctx) => <Sample ctx={ctx} prefix={'👋'} />)
  .register('bar', (ctx) => <Sample ctx={ctx} prefix={'🌳'} />)
  .register('programme', (ctx) => {

    return <Tree ctx={ctx} theme={ctx.theme} />;
  });
