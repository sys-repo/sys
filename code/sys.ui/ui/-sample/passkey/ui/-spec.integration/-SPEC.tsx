import React from 'react';
import { Harness, Signal, Spec } from '../../../-test.ui.ts';
import { D, type t } from './common.ts';
import { Controller } from '../../ui.controller/mod.ts';
import { contextOf } from '../../ui.controller/u.snapshot.ts';
import { SpecLink, WebAuthnLink } from '../-spec/-ui.Links.tsx';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

type Context = ReturnType<typeof Spec.ctx>;
type Owner = {
  debug: t.DebugSignals;
  controller: t.Controller.Instance;
};
type LiveDebugProps = {
  debug: t.DebugSignals;
  controller: Pick<t.Controller.Instance, 'current' | 'subscribe' | 'service'>;
};

export default Spec.describe(D.displayName, (e) => {
  const contexts = new WeakMap<Context, Owner>();

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    if (!ctx.is.attachable) return;
    const owner = contexts.get(ctx) ?? openOwner(ctx);
    if (!owner) return;
    const { debug, controller } = owner;
    const p = debug.props;

    // Render props may reset while the context and its effects remain alive.
    Harness.Theme.background(ctx, p.theme.value, 1);
    ctx.host.footer
      .padding([12, 16])
      .render(() => <WebAuthnLink theme={p.theme.value} />);

    // Center a fixed preview area so content grows down without moving the panel’s top.
    ctx.subject
      .size([360, 580])
      .render(() => {
        const { view, debug, theme } = Signal.toObject(p);
        return <Controller.UI controller={controller} view={view} debug={debug} theme={theme} />;
      });

    ctx.debug.footer.padding(10).render(() => <SpecLink to='view' />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    const owner = contexts.get(ctx);
    if (!owner || !ctx.is.attachable) return;
    const { debug, controller } = owner;
    ctx.debug.row(<LiveDebug debug={debug} controller={controller} />);
  });

  /** Cached suites may serve multiple contexts; state/effects belong to each context. */
  function openOwner(ctx: Context) {
    const effects = Signal.listeners(ctx.dispose$);
    const debug = createDebugSignals();
    const controller = Controller.open({ observeService: true });
    contexts.set(ctx, { debug, controller });
    effects.dispose$.subscribe(() => {
      contexts.delete(ctx);
      controller.dispose();
      debug.dispose();
    });
    effects.effect(() => {
      debug.listen();
      Harness.Theme.background(ctx, debug.props.theme.value, 1);
      void ctx.redraw();
    });
    // The initial redraw may already have disposed the context.
    return contexts.get(ctx);
  }
});

/** Observe the existing host owner without giving the sidebar a controller handle. */
function LiveDebug({ debug, controller }: LiveDebugProps) {
  const browser = React.useSyncExternalStore(
    controller.subscribe,
    () => controller.current().browser,
  );
  const { service } = controller;
  const observation = React.useSyncExternalStore(service.subscribe, service.current);
  const link = service.availability;
  const availability = React.useSyncExternalStore(link.subscribe, link.current);
  const context = contextOf(browser);
  return <Debug debug={debug} context={context} service={{ observation, availability }} />;
}
