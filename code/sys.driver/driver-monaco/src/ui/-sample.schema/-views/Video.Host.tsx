import { Player } from '@sys/ui-react-components';

import React from 'react';
import { type t, Color, Cropmarks, css, Is, Obj } from '../common.ts';

import type { Video } from '../-schemas/mod.ts';

export type VideoHostProps = {
  video?: Video;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const VideoHost: React.FC<VideoHostProps> = (props) => {
  const { video } = props;

  /**
   * Refs:
   */
  const videoSignalsRef = React.useRef(Player.Video.signals());
  const videoSignals = videoSignalsRef.current;
  const videoController = Player.Video.useSignals(videoSignals, { log: true });

  /**
   * Hooks:
   */
  const [width, setWidth] = React.useState<t.Pixels>();
  const src = videoSignals.props.src.value;
  const showVideo = !!src;

  /**
   * Effect: sync video UI model with YAML definition:
   */
  React.useEffect(() => {
    if (!video) return;

    const p = videoSignals.props;
    p.src.value = video.src;
    p.crop.value = video?.crop;
    p.cornerRadius.value = video?.cornerRadius;
    p.muted.value = video?.muted ?? false;
    p.jumpTo.value = Is.record(video?.jumpTo) ? video?.jumpTo : undefined;
    setWidth(video?.width);
  }, [Obj.hash(video), videoSignals]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    error: css({}),
    empty: css({}),
  };

  const elVideo = showVideo && <Player.Video.View style={{ width }} {...videoController.props} />;
  const elEmpty = <div className={styles.empty.class}>{'Nothing to display.'}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.04}>
        {elVideo || elEmpty}
      </Cropmarks>
    </div>
  );
};
