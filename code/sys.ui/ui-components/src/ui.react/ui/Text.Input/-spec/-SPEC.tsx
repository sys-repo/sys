import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { Color, D, type t } from '../common.ts';
import { UI as TextInput } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <TextInput
        debug={v.debug}
        theme={v.theme}
        value={v.value}
        placeholder={v.placeholder}
        prefix={v.prefix}
        suffix={v.suffix}
        //
        disabled={v.disabled}
        readOnly={v.readOnly}
        autoFocus={v.autoFocus}
        spellCheck={v.spellCheck}
        background={v.background}
        border={v.border}
        borderRadius={v.borderRadius}
        // ⚡️
        onReady={(e: t.TextInput.ReadyArgs) => console.info(`🌳 onReady:`, e)}
        onKeyDown={(e: t.TextInput.KeyArgs) => console.info(`⚡️ onKeyDown:`, e)}
        onKeyUp={(e: t.TextInput.KeyArgs) => console.info(`⚡️ onKeyUp:`, e)}
        onFocusChange={(e: t.TextInput.FocusArgs) => console.info(`⚡️ onFocusChange:`, e)}
        onChange={(e: t.TextInput.ChangeArgs) => {
          console.info(`⚡️ onChange:`, e);
          p.value.value = e.value;
        }}
        onPaste={(e: t.TextInput.PasteArgs) => {
          console.info(`⚡️ onPaste:`, e);
          // e.modify('hello');
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: 'fill-x', margin: 150, display: 'grid', render: () => <Root /> },
      effects: [
        () => {
          const theme = Color.theme(p.theme.value);
          Harness.Theme.background(ctx, theme);
          const bg = theme.is.dark ? Color.lighten(Color.DARK, 2) : null;
          ctx.host.backgroundColor(bg);
        },
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
