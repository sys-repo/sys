import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';

import { Color, css, D, ObjectView } from '../common.ts';
import { DocumentId } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

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
      signals: { doc: p.doc, textbox: p.textbox },
      initial: () => ({ count: 0 }), // NB: dynamic generator.
      url: v.url,
      urlKey: v.urlKey,
    };

    const hook = DocumentId.useController(args);

    /**
     * Render:
     */
    const theme = Color.theme(p.theme.value);

    const elDebug = v.debug && (
      <div className={css({ Absolute: [null, 0, -25, 25] }).class}>
        <ObjectView
          name={'doc'}
          data={p.doc.value?.current}
          style={{ Absolute: [null, 0, null, 0] }}
          theme={v.theme}
        />
      </div>
    );

    return (
      <>
        {elDebug}

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
          //
          onReady={(e) => console.info(`🌳 Input.DocumentId.onReady:`, e)}
          onChange={(e) => console.info(`⚡️ Input.DocumentId.onChange:`, e)}
        />
      </>
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
        const v = Signal.toObject(p);
        return (
          <DocumentId.View
            theme={'Light'}
            buttonStyle={{ margin: 4 }}
            controller={{
              repo: v.passRepo ? repo : undefined,
              signals: { doc: p.doc, textbox: p.textbox },
              initial: { count: 0, text: '' }, // NB: static version.
              localstorage: p.localstorage.value,
              url: v.url,
              urlKey: v.urlKey,
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
