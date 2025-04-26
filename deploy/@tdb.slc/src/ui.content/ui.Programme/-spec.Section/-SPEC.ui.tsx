import { type t } from '../../-test.ui.ts';
import { Color, css, Player, Signal } from '../common.ts';
import { Programme } from '../mod.ts';
import { Section } from '../ui.Column.Section.tsx';

export type RootProps = {
  state: t.ProgrammeSignals;
  theme?: t.CommonTheme;
};

/**
 * Component:
 */
export const Root: React.FC<RootProps> = (props) => {
  const { state } = props;
  const p = state.props;
  const controller = Programme.useSectionController(state);
  const videoSrc = `${controller.player?.src ?? '<undefined>'}`;

  /**
   * Effect: Redraw.
   */
  Signal.useRedrawEffect(() => state.listen());

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const border = `solid 1px ${Color.alpha(theme.fg, 0.1)}`;
  const styles = {
    base: css({ width: 390, display: 'grid', gridTemplateRows: `1fr auto`, rowGap: 30 }),
    section: css({ backgroundColor: theme.bg, borderBottom: border, display: 'grid' }),
    video: {
      base: css({ position: 'relative', borderTop: border }),
      label: css({ Absolute: [null, null, -20, 8], fontSize: 11, opacity: 0.5 }),
    },
  };

  return (
    <div className={styles.base.class}>
      <div className={styles.section.class}>
        <Section
          debug={p.debug.value}
          theme={theme.name}
          media={controller.media.section}
          selected={controller.index.child}
          onSelect={(e) => {
            console.info(`Section.onSelect:`, e);
            controller.onSelectChild(e.index);
          }}
        />
      </div>
      <div className={styles.video.base.class}>
        <div className={styles.video.label.class}>{`video:src: ${videoSrc}`}</div>
        <Player.Video.View
          key={videoSrc}
          signals={controller.player}
          onEnded={() => {
            console.info(`⚡️ onEneded`);
          }}
        />
      </div>
    </div>
  );
};
