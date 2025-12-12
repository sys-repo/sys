import React from 'react';
import { type t, Player, Color, css, D, KeyValue, Obj, Cropmarks } from './common.ts';
import { TimelineGrid } from './ui.TimelineGrid.tsx';
import { Video } from './ui.Harness.Video.tsx';
import { InfoPanel } from './ui.InfoPanel.tsx';

export const Harness: React.FC<t.MediaTimelineHarnessProps> = (props) => {
  const { debug = false, video, bundle, docid } = props;

  /**
   * Behavior/State (hooks):
   */
  const controller = Player.Video.useSignals(video, { log: debug });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: '420px 1fr',
    }),
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
      }),
    },
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.top.class}>
        <Video theme={theme.name} video={video} />
        <Video theme={theme.name} video={video} />
      </div>

      <div className={styles.bottom.base.class}>
        <div className={styles.bottom.left.class}>
          <TimelineGrid bundle={bundle} theme={theme.name} />
        </div>
        <div className={styles.bottom.right.class}>
          <InfoPanel theme={theme.name} bundle={bundle} docid={docid} />
        </div>
      </div>
    </div>
  );
};
