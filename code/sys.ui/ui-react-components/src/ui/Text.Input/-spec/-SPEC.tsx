import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D, Color } from '../common.ts';
import { TextInput } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();

      const isDark = p.theme.value === 'Dark';
      const bg = isDark ? Color.lighten(Color.DARK, 2) : null;
      ctx.host.backgroundColor(bg);
    });

    ctx.subject
      .size('fill-x', 150)
      .display('grid')
      .render(() => (
        <TextInput
          debug={p.debug.value}
          theme={p.theme.value}
          value={p.value.value}
          placeholder={p.placeholder.value}
          autoFocus={p.autoFocus.value}
          disabled={p.disabled.value}
          background={p.background.value}
          border={p.border.value}
          onChange={(e) => (p.value.value = e.value)}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
