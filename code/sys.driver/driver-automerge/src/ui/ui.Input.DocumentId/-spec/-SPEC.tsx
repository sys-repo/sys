import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';

import { Input } from '../../ui.Input/mod.ts';
import { Color, D } from '../common.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

type SampleDoc = { count: number; text?: string };

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const repo = debug.repo;
  const p = debug.props;

  function Root() {
    /**
     * NOTE: either pass down the hook (instance) OR the
     *       setup arguments for the hook.
     */
    const signals: Partial<t.DocumentIdHookSignals> = { doc: p.doc, id: p.docId };
    const args: t.UseDocumentIdHookArgs<SampleDoc> = {
      signals,
      repo: p.passRepo.value ? repo : undefined,
      localstorageKey: p.localstorageKey.value,
      initial: () => ({ count: 0 }), // NB: dynamic generator.
    };
    const hook = Input.DocumentId.useController(args);

    /**
     * Render:
     */
    const theme = Color.theme(p.theme.value);
    return (
      <Input.DocumentId.View
        debug={p.debug.value}
        theme={p.theme.value}
        //
        controller={p.controlled.value ? hook : args}
        label={p.label.value}
        placeholder={p.placeholder.value}
        enabled={p.enabled.value}
        readOnly={p.readOnly.value}
        autoFocus={p.autoFocus.value}
        background={theme.is.dark ? -0.06 : -0.04}
        //
        onReady={(e) => console.info(`⚡️ Input.DocumentId.onReady:`, e)}
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
        const localstorageKey = p.localstorageKey.value;
        return (
          <Input.DocumentId.View
            theme={'Light'}
            buttonStyle={{ margin: 4 }}
            controller={{
              repo: p.passRepo.value ? repo : undefined,
              signals: { doc: p.doc, id: p.docId },
              initial: { count: 0, text: '' }, // NB: static version.
              localstorageKey,
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
