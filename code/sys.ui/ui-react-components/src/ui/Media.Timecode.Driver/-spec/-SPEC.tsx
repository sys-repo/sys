import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Color, D, DriverDev, css } from './-common.ts';

import { Ownership } from '../../Ownership/mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const theme = Color.theme(v.theme);

    const styles = {
      base: css({ position: 'relative', display: 'grid', color: theme.fg }),
      trait: {
        base: css({
          Absolute: [null, null, -55, -64], // bottom-left
          position: 'relative',
          fontFamily: 'monospace',
          fontSize: 13,
          color: Color.alpha(theme.fg, 0.3),
        }),
        A: css({ color: theme.fg }),
        B: css({ color: Color.CYAN }),
      },
    };

    const elTrait = (
      <div className={styles.trait.base.class}>
        <span className={styles.trait.A.class}>trait:</span> {'"'}
        <span className={styles.trait.B.class}>media-composition</span>
        {'"'}
      </div>
    );

    return (
      <div className={styles.base.class}>
        {elTrait}
        <DriverDev.Harness
          debug={v.debug}
          theme={v.theme}
          docid={v.docid}
          video={debug.video}
          bundle={v.bundle}
          layout={{
            infopanel: {
              bottom: <Ownership.UI theme={v.theme} />,
              // bottom: <div>Bottom 👋</div>,
            },
          }}
          onReady={(e) => {
            console.info(`⚡️ MediaTimecode.Dev.Harness.onReady:`, e);
            p.controller.value = e.controller;
          }}
        />
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size('fill', 100)
      .display('grid')
      .render(() => {
        return <Root />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
