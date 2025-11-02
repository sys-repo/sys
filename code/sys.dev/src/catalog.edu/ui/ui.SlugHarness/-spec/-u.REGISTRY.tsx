import { Color, Crdt, Lens, Log } from '../common.ts';
import { makeRegistry } from '../mod.ts';
import { Sample } from './-ui.Sample.tsx';
import { Tree } from './-ui.Tree.tsx';

type O = Record<string, unknown>;

const logInfo = Log.logger('view:registry', {
  enabled: false,
  timestamp: null,
  prefixColor: Color.MAGENTA,
});

export const registry = makeRegistry()
  .register('foo', (ctx) => <Sample ctx={ctx} />)
  .register('slug-tree', (ctx) => {
    const lens = ctx.doc ? Lens.at<O>(ctx.doc, ctx.path.doc, ctx.path.slug) : undefined;

    logInfo('slug renderer factory:');
    logInfo('- ctx.view:', ctx.view);
    logInfo(`- ctx.slug:`, Crdt.toObject(ctx.slug));
    logInfo(`- ctx.slug:/${(ctx.path.slug ?? []).join('/')}`, Crdt.toObject(lens?.get()));
    logInfo('- ctx:', ctx);
    return <Tree ctx={ctx} theme={ctx.theme} />;
  })
  .register('concept-layout', (ctx) => {
    return `🐷 ${ctx.view}`; // TODO 🐷 concept-layout
  })
  .register('file-list', (ctx) => {
    return `🐷 ${ctx.view}`; // TODO 🐷 file-list
  })
  .register('video-recorder', (ctx) => {
    return `🐷 ${ctx.view}`; // TODO 🐷 file-list
  })
  .register('slug-renderer', (ctx) => {
    return `🐷 ${ctx.view}`; // TODO 🐷 file-list
  });
