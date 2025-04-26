import { Dev, Spec } from '../../-test.ui.ts';
import { Color, css, Player, Signal } from '../common.ts';
import { Section } from '../ui.Column.Section.tsx';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('MyComponent', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  const Root = () => {
    const programme = debug.state.component;
    const index = programme.props.section?.value?.index ?? -1;
    const media = programme.props.media.value?.children?.[index];
    const labelSrc = `${media?.video.props.src ?? '<undefined>'}`;

    Signal.useRedrawEffect(() => {
      programme.listen();
    });

    /**
     * Render:
     */
    const theme = Color.theme(p.theme.value);
    const border = `solid 1px ${Color.alpha(theme.fg, 0.1)}`;
    const styles = {
      base: css({ width: 390, display: 'grid', gridTemplateRows: `1fr auto`, rowGap: 30 }),
      section: css({ backgroundColor: theme.bg, borderBottom: border, display: 'grid' }),
      video: {
        base: css({ position: 'relative', borderTop: border }),
        label: css({
          Absolute: [null, null, -20, 8],
          fontSize: 11,
          opacity: 0.5,
        }),
      },
    };
    return (
      <div className={styles.base.class}>
        <div className={styles.section.class}>
          <Section debug={p.debug.value} theme={p.theme.value} media={media} />
        </div>
        <div className={styles.video.base.class}>
          <div className={styles.video.label.class}>{`video:src: ${labelSrc}`}</div>
          <Player.Video.View signals={media?.video} onEnded={() => console.info(`⚡️ onEneded`)} />
        </div>
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
      .render(() => <Root />);

    /**
     * Initial state:
     */
    p.theme.value = 'Light';
    debug.state.component.props.section.value = { index: 0 };
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
