import React from 'react';
import { Color, css, type t } from './common.ts';
import { Grid, type SelectIndexHandler } from './ui.Grid.tsx';
import { InfoPanel } from './ui.InfoPanel.tsx';
import { Video } from './ui.Video.tsx';

type P = t.MediaTimeline.Dev.Harness.Props;
type LayoutProps = Pick<P, 'video' | 'bundle' | 'docid' | 'layout'> & {
  /** Presence */
  readonly hasBundle: boolean;

  /** Selected beat */
  readonly selectedIndex?: t.TimecodeState.Playback.BeatIndex;
  readonly beat?: t.Timecode.Experience.Beat;

  /** Visuals */
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  /** UI callbacks (pure intent) */
  onSelectIndex?: SelectIndexHandler;
};

/**
 * Component:
 */
export const Layout: React.FC<LayoutProps> = (props) => {
  const {
    debug = false,
    hasBundle,
    video,
    bundle,
    docid,
    selectedIndex,
    beat,
    layout = {},
  } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
    layout: {
      base: css({ display: 'grid', gridTemplateRows: '340px 1fr' }),
      top: css({
        borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.12)}`,
        display: 'grid',
        gridTemplateColumns: `1fr 1fr`,
      }),
      bottom: {
        base: css({ display: 'grid', gridTemplateColumns: `1fr auto` }),
        left: css({ position: 'relative', display: 'grid' }),
        right: css({
          position: 'relative',
          width: 300,
          borderLeft: `solid 1px ${Color.alpha(theme.fg, 0.12)}`,
          display: 'grid',
        }),
      },
    },
    placeholder: css({
      userSelect: 'none',
      display: 'grid',
      placeItems: 'center',
      fontSize: 14,
      opacity: 0.6,
    }),
  } as const;

  const elPlaceholder = !hasBundle && (
    <div className={styles.placeholder.class}>Timeline bundle not loaded</div>
  );

  const elLayout = hasBundle && (
    <div className={styles.layout.base.class}>
      <div className={styles.layout.top.class}>
        <Video deck="A" theme={theme.name} video={video?.A} debug={debug} />
        <Video deck="B" theme={theme.name} video={video?.B} debug={debug} />
      </div>
      <div className={styles.layout.bottom.base.class}>
        <div className={styles.layout.bottom.left.class}>
          <Grid
            bundle={bundle}
            theme={theme.name}
            selectedIndex={selectedIndex}
            onSelect={props.onSelectIndex}
          />
        </div>
        <div className={styles.layout.bottom.right.class}>
          <InfoPanel
            docid={docid}
            bundle={bundle}
            index={selectedIndex}
            layout={layout.infopanel}
            beat={beat}
            debug={debug}
            theme={theme.name}
          />
        </div>
      </div>
    </div>
  );

  return <div className={css(styles.base, props.style).class}>{elPlaceholder || elLayout}</div>;
};
