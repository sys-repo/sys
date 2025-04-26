import { type t, Dev, Signal, Spec } from '../../-test.ui.ts';
import { css, Player, Color } from '../common.ts';
import { Section } from '../ui.Column.Section.tsx';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('MyComponent', (e) => {
  const debug = createDebugSignals();
  const content = debug.content;
  const p = debug.props;

  const Root = (props: { media?: t.VideoMediaContent }) => {
    const { media } = props;

    /**
     * Render:
     */
    const theme = Color.theme(p.theme.value);
    const border = `solid 1px ${Color.alpha(theme.fg, 0.1)}`;
    const styles = {
      base: css({ width: 390, display: 'grid', gridTemplateRows: `1fr auto`, rowGap: 30 }),
      section: css({ backgroundColor: theme.bg, borderBottom: border, display: 'grid' }),
      video: css({ borderTop: border }),
    };
    return (
      <div className={styles.base.class}>
        <div className={styles.section.class}>
          <Section debug={p.debug.value} theme={p.theme.value} media={media} />
        </div>
        <Player.Video.View
          style={styles.video}
          signals={media?.video}
          onEnded={() => console.info(`⚡️ onEneded`)}
        />
      </div>
    );
  };

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill-y')
      .display('grid')
      .render(() => {
        const media = content.media?.children?.[1];
        return <Root media={media} />;
      });

    /**
     * Initial:
     */
    console.info('💦 state:app:', Signal.toObject(debug.app));
    console.info('💦 content:("Programme"):', debug.content);
    p.theme.value = 'Light';
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
