import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';

import { Input } from '../../ui.Input/mod.ts';
import { Color, D } from '../common.ts';
import { DocumentIdInput } from '../mod.ts';
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
    const signals: Partial<t.DocumentIdHookSignals> = { id: p.docId, doc: p.docRef };
    const args: t.UseDocumentIdHookArgs<SampleDoc> = {
      signals,
      repo: p.passRepo.value ? repo : undefined,
      initial: () => ({ count: 0 }),
    };
    const hook = DocumentIdInput.useController(args);

    /**
     * Render:
     */
    const theme = Color.theme(p.theme.value);
    return (
      <DocumentIdInput.View
        controller={p.controlled.value ? hook : args}
        label={p.label.value}
        placeholder={p.placeholder.value}
        autoFocus={p.autoFocus.value}
        debug={p.debug.value}
        theme={p.theme.value}
        enabled={p.enabled.value}
        textboxBackground={theme.is.dark ? -0.06 : -0.04}
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
          <Input.DocumentId.View
            theme={'Light'}
            buttonStyle={{ margin: 4 }}
            columnGap={0}
            controller={{
              repo,
              signals: { id: p.docId, doc: p.docRef },
              initial: { count: 0, text: '' },
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
