import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { HeadDebug } from './-SPEC.Debug.tsx';
import { SpecRoot } from './-SPEC.ui.Root.tsx';
import { D, createDebugSignals, makeDebugPanel } from './common.ts';

export default Spec.describe(D.name, async (e) => {
  const debug = await createDebugSignals({
    card: {
      defaultKind: 'playback-content',
      kinds: ['playback-content'],
      allowKindSelect: false,
    },
  });
  const p = debug.props;

  const DebugPanel = makeDebugPanel({
    debug,
    headTab: {
      id: 'head:playback',
      label: 'MediaPlayback',
      render: () => <HeadDebug debug={debug} />,
    },
  });

  function Root() {
    return <SpecRoot debug={debug} />;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug
      .scroll(false)
      .padding(0)
      .row(<DebugPanel />);
  });
});
