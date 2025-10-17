import { Media } from '@sys/ui-react-components';
import { RecorderHookView } from '@sys/ui-react-components/media/recorder/dev';

import React from 'react';
import { type t, Color, css, Slug } from '../common.ts';

export type SlugViewVideoRecorderProps = {
  slug: t.Slug;
  traitAlias: t.SlugTraitAlias;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
type P = SlugViewVideoRecorderProps;

/**
 * Component:
 */
export const SlugViewVideoRecorder: React.FC<P> = (props) => {
  const { debug = false, slug, traitAlias } = props;

  const traitProps = wrangle.traitProps(props);
  const title = traitProps?.name ?? 'Unnamed';

  /**
   * Hooks:
   */
  const [stream, setStream] = React.useState<MediaStream>();
  const recorder = Media.Recorder.UI.useRecorder(stream);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ backgroundColor: Color.ruby(debug), color: theme.fg, display: 'grid' }),
    title: css({
      Padding: [5, 8],
      backgroundColor: Color.alpha(theme.fg, 0.06),
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.2)}`,
      fontSize: 13,
      lineHeight: 1.2,
      marginBottom: 5,
    }),
    recorder: css({ marginLeft: 20 }),
  };

  const elStream = (
    <Media.Video.UI.Stream
      theme={theme.name}
      constraints={{
        audio: {
          channelCount: { ideal: 2 },
          sampleRate: { ideal: 48_000 },
          sampleSize: { ideal: 16 },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 }, // 1280×720 HD
          height: { ideal: 720 },
          frameRate: { ideal: 30 }, // 30 fps
        },
      }}
      onReady={(e) => {
        console.info(`⚡️ Video.Stream.onReady:`, e);
        setStream(e.stream.filtered);
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{title}</div>
      <RecorderHookView theme={theme.name} recorder={recorder} style={styles.recorder} />
      {elStream}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  traitProps(props: P): t.VideoRecorderProps | undefined {
    const { slug, traitAlias } = props;
    const v = slug.props?.[traitAlias];
    return Slug.Traits.Is.videoPlayerProps(v) ? v : undefined;
  },
} as const;
