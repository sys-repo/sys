import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';

import { DocumentId } from '../../mod.ts';
import { Color, D } from '../common.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

type SampleDoc = { count: number; text?: string };

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);

    /**
     * NOTE: either pass down the hook (instance)
     *       OR the setup arguments for the hook.
     */
    const args: t.UseDocumentIdHookArgs<SampleDoc> = {
      repo: v.passRepo ? repo : undefined,
      localstorage: v.localstorage,
      signals: { doc: p.doc, docId: p.docId },
      initial: () => ({ count: 0 }), // NB: dynamic generator.
    };
    const hook = DocumentId.useController(args);

    /**
     * Render:
     */
    const theme = Color.theme(p.theme.value);
    return (
      <DocumentId.View
        debug={v.debug}
        theme={v.theme}
        //
        controller={v.controlled ? hook : args} // ← NB: "controlled" OR "uncontrolled"
        label={v.label}
        placeholder={v.placeholder}
        enabled={v.enabled}
        readOnly={v.readOnly}
        autoFocus={v.autoFocus}
        background={theme.is.dark ? -0.06 : -0.04}
        urlSupport={v.urlSupport}
        //
        onReady={(e) => console.info(`🌳 Input.DocumentId.onReady:`, e)}
        onChange={(e) => console.info(`⚡️ Input.DocumentId.onChange:`, e)}
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
      .size([480, null])
      .display('grid')
      .render(() => <Root />);

    ctx.debug.header
      .padding(0)
      .border(-0.1)
      .render(() => {
        return (
          <DocumentId.View
            theme={'Light'}
            buttonStyle={{ margin: 4 }}
            controller={{
              repo: p.passRepo.value ? repo : undefined,
              signals: { doc: p.doc, docId: p.docId },
              initial: { count: 0, text: '' }, // NB: static version.
              localstorage: p.localstorage.value,
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
