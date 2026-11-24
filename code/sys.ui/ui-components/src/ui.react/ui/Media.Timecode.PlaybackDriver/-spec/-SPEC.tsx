import { DriverDev } from '../-dev/-harness/mod.ts';
import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { Color, css, D } from './common.ts';

import { Ownership } from '../../Ownership/mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

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
          url={debug.urls.app}
          decks={debug.decks}
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
          onSnapshot={(e) => {
            p.snapshot.value = e.snapshot;
          }}
        />
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: 'fill', margin: 100, display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
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
