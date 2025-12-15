import React from 'react';
import { useTimelineController } from '../use.TimelineController.ts';

import { type t, Color, css } from './common.ts';
import { Grid } from './ui.Grid.tsx';
import { InfoPanel } from './ui.InfoPanel.tsx';
import { Video } from './ui.Video.tsx';

export const Harness: React.FC<t.MediaTimelineHarnessProps> = (props) => {
  const { debug = false, bundle, docid, video, layout = {} } = props;

  /**
   * Hooks:
   */
  const controller = useTimelineController({ bundle, video });
  const beat = controller.beats[controller.activeIndex ?? -1]?.beat;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: '340px 1fr',
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
        display: 'grid',
      }),
    },
  } as const;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.top.class}>
        <Video deck={'A'} theme={theme.name} video={video?.A} debug={debug} />
        <Video deck={'B'} theme={theme.name} video={video?.B} debug={debug} />
      </div>

      <div className={styles.bottom.base.class}>
        <div className={styles.bottom.left.class}>
          <Grid
            bundle={bundle}
            theme={theme.name}
            selectedIndex={controller.activeIndex}
            onSelect={(e) => controller.select(e.index)}
          />
        </div>

        <div className={styles.bottom.right.class}>
          <InfoPanel
            docid={docid}
            bundle={bundle}
            index={controller.activeIndex}
            layout={layout.infopanel}
            beat={beat}
            debug={debug}
            theme={theme.name}
          />
        </div>
      </div>
    </div>
  );
};
