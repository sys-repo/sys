import { Color, Crdt, Lens, Log } from '../common.ts';
import { makeRegistry } from '../mod.ts';
import { Sample } from './-ui.Sample.tsx';
import { Tree } from './-ui.Tree.tsx';

type O = Record<string, unknown>;
const logInfo = Log.logger('view:registry', { timestamp: null, prefixColor: Color.MAGENTA });

export const registry = makeRegistry()
  .register('foo', (ctx) => <Sample ctx={ctx} prefix={'👋'} />)
  .register('bar', (ctx) => <Sample ctx={ctx} prefix={'🌳'} />)
  .register('programme', (ctx) => {
    const lens = ctx.doc ? Lens.at<O>(ctx.doc, ctx.path.doc, ctx.path.slug) : undefined;

    return <Tree ctx={ctx} theme={ctx.theme} />;
  });
