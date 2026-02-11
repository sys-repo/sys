import React from 'react';
import { Dev, Signal, Spec } from '../../ui/-test.ui.ts';
import { type t, Color, css, D, Fonts, useFontBundle } from './common.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

type FontName = keyof typeof Fonts;

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog.';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const fontName = (v.font ?? 'ETBook') as FontName;
    const bundle = Fonts[fontName];
    useFontBundle(bundle);

    const theme = Color.theme(v.theme);
    const styles = {
      base: css({
        color: theme.fg,
        backgroundColor: theme.bg,
        display: 'grid',
        gap: 12,
        Padding: [32, 28],
      }),
      title: css({
        fontSize: 14,
        opacity: 0.6,
        fontFamily: 'monospace',
      }),
      sample: css({
        fontFamily: `"${bundle.config.family}"`,
        fontSize: 38,
        lineHeight: 1.15,
      }),
    };

    return (
      <div className={styles.base.class}>
        <div className={styles.title.class}>{bundle.config.family}</div>
        <div className={styles.sample.class}>{SAMPLE_TEXT}</div>
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([640, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
