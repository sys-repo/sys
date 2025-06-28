import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { MonacoEditor } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('MonacoEditor', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill', 150)
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        if (!v.render) return null;

        return (
          <MonacoEditor
            debug={v.debug}
            theme={v.theme}
            //
            placeholder={v.placeholder}
            text={v.text}
            language={v.language}
            //
            enabled={v.enabled}
            autoFocus={v.autoFocus}
            minimap={v.minimap}
            readOnly={v.readOnly}
            tabSize={v.tabSize}
            //
            onReady={(e) => {
              console.info(`⚡️ MonacoEditor.onReady:`, e);
              p.editor.value = e.editor;
              p.carets.value = e.carets;
            }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
