import { Monaco } from '@sys/driver-monaco';
import { Color, Dev, PathView, Signal, Spec } from '../../-test.ui.ts';

import { MonacoEditor } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('MonacoEditor', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function HostSubject() {
    const v = Signal.toObject(p);
    return (
      <MonacoEditor
        debug={v.debug}
        theme={v.theme}
        //
        defaultValue={v.defaultValue}
        placeholder={v.placeholder}
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

          // Listeners:
          const path = Monaco.Yaml.Path.observe(e.editor, e.dispose$);
          path.$.subscribe((e) => (p.selectedPath.value = e.path));
        }}
      />
    );
  }

  function HostPath() {
    const v = Signal.toObject(p);
    if (v.selectedPath.length === 0) return null;
    return (
      <PathView
        prefix={'Monaco.Dev.PathView:'}
        prefixColor={Color.CYAN}
        path={v.selectedPath}
        theme={v.theme}
        style={{ Absolute: [null, 17, -30, 17] }}
      />
    );
  }

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
        if (!p.render.value) return null;
        return (
          <>
            <HostSubject />
            <HostPath />
          </>
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
