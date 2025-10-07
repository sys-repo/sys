import { type t } from '../../-test.ui.ts';
import { Color, css, Player, Signal } from '../common.ts';
import { Programme } from '../mod.ts';
import { Section } from '../ui.Column.Section.tsx';

export type RootProps = {
  state: t.ProgrammeSignals;
  content: t.ProgrammeContent;
  video: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
};

/**
 * Component:
 */
export const Root: React.FC<RootProps> = (props) => {
  const { content, state, video } = props;
  const p = state.props;
  const debug = p.debug.value;

  /**
   * Hooks:
   */
  const controller = Programme.useController({ state, video });
  const player = Player.Video.useSignals(video);

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
    video: css({ position: 'relative', borderTop: border }),
  };

  const elPlayer = (
    <Player.Video.Element
      {...player.props}
      debug={debug}
      onEnded={(e) => console.info(`⚡️ onEnded:`, e)}
    />
  );

  return (
    <div className={styles.base.class}>
      <div className={styles.section.class}>
        <Section
          debug={debug}
          theme={theme.name}
          //
          state={state}
          content={content}
          video={video}
          //
          onSelect={(e) => {
            console.info(`⚡️ Section.onSelect:`, e);
            controller.section.onChildSelected(e.index);
          }}
        />
      </div>
      <div className={styles.video.class}>{elPlayer}</div>
    </div>
  );
};
