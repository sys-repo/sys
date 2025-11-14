import { Dev, Signal, Spec } from '../../-test.ui.ts';

import { type t, D, Repo, STORAGE_KEY } from '../common.ts';
import { Layout } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Foo } from './-ui.Foo.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.debug.width(380);
    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);

        const suffix = (doc?: t.Crdt.Ref) => (doc ? `- (crdt:${doc.id.slice(-5)})` : '');
        const slots: t.LayoutSlots = {
          main: (ctx) => <Foo ctx={ctx} label={`🌳 Main ${suffix(ctx.doc)}`} />,
          sidebar: (ctx) => <Foo ctx={ctx} label={`🌳 Sidebar ${suffix(ctx.doc)}`} />,
          footer: (ctx) => <Foo ctx={ctx} label={`🌳 Footer ${suffix(ctx.doc)}`} padding={0} />,
        };

        return (
          <Layout.View
            debug={v.debug}
            theme={v.theme}
            spinning={v.spinning}
            signals={debug.signals}
            crdt={debug.crdt}
            header={v.header}
            sidebar={v.sidebar}
            cropmarks={v.cropmarks}
            slots={v.debugSlots ? slots : undefined}
          />
        );
      });

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => {
        return (
          <Repo.SyncSwitch
            repo={debug.repo}
            localstorage={STORAGE_KEY.DEV}
            style={{ Padding: [14, 10] }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
