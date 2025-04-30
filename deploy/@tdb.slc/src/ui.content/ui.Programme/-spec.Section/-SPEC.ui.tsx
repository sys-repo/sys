import { type t } from '../../-test.ui.ts';
import { Color, css, Player, Signal } from '../common.ts';
import { Programme } from '../mod.ts';
import { Section } from '../ui.Column.Section.tsx';

export type RootProps = {
  state: t.ProgrammeSignals;
  content: t.ProgrammeContent;
  player: t.VideoPlayerSignals;
  theme?: t.CommonTheme;
};

/**
 * Component:
 */
export const Root: React.FC<RootProps> = (props) => {
  const { state, content, player } = props;
  const p = state.props;

  const controller = Programme.useController(state);
  const debug = p.debug.value;

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

  return (
    <div className={styles.base.class}>
      <div className={styles.section.class}>
        <Section
          debug={debug}
          theme={theme.name}
          //
          state={state}
          content={content}
          player={player}
          //
          onSelect={(e) => {
            console.info(`⚡️ Section.onSelect:`, e);
            controller.section.onChildSelected(e.index);
          }}
        />
      </div>
      <div className={styles.video.class}>
        <Player.Video.View
          debug={debug}
          signals={player}
          onEnded={() => console.info(`⚡️ onEnded`)}
        />
      </div>
    </div>
  );
};
