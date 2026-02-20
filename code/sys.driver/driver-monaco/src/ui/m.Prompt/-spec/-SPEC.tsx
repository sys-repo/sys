import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Root } from './-ui.Root.tsx';
import { type t, Color, D, Keyboard, Rx } from './common.ts';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;
  let keyboardLife: t.Lifecycle | undefined;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    const currentTheme = () => Color.theme(p.theme.value);

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    keyboardLife?.dispose();
    keyboardLife = Rx.lifecycle();
    Keyboard.until(keyboardLife.dispose$).on('Escape', (e) => {
      p.editorFooter.value?.focus();
      e.handled();
    });

    ctx.subject
      .size('fill-x', 100)
      .display('grid')
      .render(() => <Root owner={'subject'} debug={debug} autoFocus={true} />);

    ctx.host.footer
      .padding(0)
      .border(Color.alpha(currentTheme().fg, 0.1))
      .render(() => <Root owner={'subject:footer'} debug={debug} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
