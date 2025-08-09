import { Player } from '@sys/ui-react-components';

import React from 'react';
import type { Video } from '../-schemas/mod.ts';
import { type t, Color, Cropmarks, css, Is, Obj } from '../common.ts';

export type VideoHostProps = {
  data?: Video;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const VideoPlayerHost: React.FC<VideoHostProps> = (props) => {
  const { data } = props;

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
    if (!data) return;

    const p = videoSignals.props;
    p.src.value = data.src;
    p.crop.value = data?.crop;
    p.cornerRadius.value = data?.cornerRadius;
    p.muted.value = data?.muted ?? false;
    p.jumpTo.value = Is.record(data?.jumpTo) ? data?.jumpTo : undefined;
    setWidth(data?.width);
  }, [Obj.hash(data), videoSignals]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    empty: css({ userSelect: 'none' }),
  };

  const elVideo = showVideo && (
    <Player.Video.Element style={{ width }} {...videoController.props} />
  );
  const elEmpty = <div className={styles.empty.class}>{'Nothing to display.'}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.04}>
        {elVideo || elEmpty}
      </Cropmarks>
    </div>
  );
};
