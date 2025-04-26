import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Programme } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.name, async (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  const global = debug.app;
  const content = debug.content;
  const component = debug.programme;
  const state = { global, component };

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => {
        return <Programme.View.Main state={state} content={debug.content} theme={'Light'} />;
      });

    /**
     * Initial:
     */
    console.info('💦 state:app:', Signal.toObject(debug.app));
    console.info('💦 content:("Programme"):', debug.content);

    state.component.props.align.value = 'Right';
    state.component.props.media.value = content.media?.children?.[1];
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
