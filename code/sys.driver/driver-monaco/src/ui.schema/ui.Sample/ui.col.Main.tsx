import { Player } from '@sys/ui-react-components';
import type { VideoElementProps } from '@sys/ui-react-components/t';

import React from 'react';
import { type t, Color, Cropmarks, css, Is, Obj } from './common.ts';
import { useYamlMarkers } from './use.YamlMarkers.ts';

type P = t.SampleProps & { yaml: t.EditorYaml };
type V = VideoElementProps;
type Video = {
  width?: t.Pixels;
  src?: V['src'];
  crop?: V['crop'];
  cornerRadius?: V['cornerRadius'];
  muted?: V['muted'];
  jumpTo?: V['jumpTo'];
};

const PATH = {
  VIDEO: Obj.Path.curry<Video>(['foo.parsed', 'video']),
};

/**
 * Component:
 */
export const MainColumn: React.FC<P> = (props) => {
  const { signals, yaml } = props;
  const doc = signals.doc.value;
  const monaco = signals.monaco.value;
  const editor = signals.editor.value;
  const video = PATH.VIDEO.get(doc?.current, {});

  const errors = yaml.parsed.errors;
  const hasErrors = errors.length > 0;

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
  useYamlMarkers(monaco, editor, errors);

  const src = videoSignals.props.src.value;
  const showVideo = !!src;

  /**
   * Effect:
   */
  React.useEffect(() => {
    const p = videoSignals.props;
    p.src.value = video?.src;
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
  const elError = hasErrors && <div className={styles.empty.class}>{'YAML contains errors.'}</div>;
  const elEmpty = <div className={styles.empty.class}>{'Nothing to display.'}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.04}>
        {elError || elVideo || elEmpty}
      </Cropmarks>
    </div>
  );
};
