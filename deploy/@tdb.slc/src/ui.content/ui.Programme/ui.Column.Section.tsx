import React, { useRef, useState } from 'react';
import {
  type t,
  Color,
  css,
  LogoCanvas,
  Playlist,
  useSizeObserver,
  useLoading,
  Time,
} from './common.ts';

export type SectionProps = {
  debug?: boolean;
  media: t.VideoMediaContent;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type Part = 'Canvas';

/**
 * Component:
 */
export const Section: React.FC<SectionProps> = (props) => {
  const { media, debug = false } = props;

  const loading = useLoading<Part>(['Canvas']);
  const playlistRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const size = useSizeObserver();
  const [threshold, setThreshold] = useState(0);
  const isReady = size.ready && loading.ready;
  const isCanvasVisible = size.height > threshold;

  /**
   * Effect: calculate size thresholds.
   */
  const depsChildren = media.children?.map((m) => m.id).join('|');
  React.useLayoutEffect(() => {
    if (!isReady) return;
    const canvas = canvasRef.current?.offsetHeight ?? 0;
    const playlist = playlistRef.current?.offsetHeight ?? 0;
    setThreshold(canvas + playlist + 20);
  }, [isReady, depsChildren]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      opacity: size.ready ? 1 : 0,
      display: 'grid',
      alignContent: 'start',
    }),
    body: css({
      display: 'grid',
      alignContent: 'start',
    }),
    canvas: css({
      Padding: [35, '18%', 0, '18%'],
      display: isCanvasVisible ? 'block' : 'none',
    }),
    playlist: css({
      marginLeft: 85,
    }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <div ref={canvasRef} className={styles.canvas.class}>
        <LogoCanvas
          theme={theme.name}
          onReady={() => loading.ready('Canvas')}
          onPanelEvent={(e) => console.log(`⚡️ onPanelEvent:${e.type}`, e)}
        />
      </div>
      <div ref={playlistRef} className={styles.playlist.class}>
        <Playlist
          items={media.children}
          theme={theme.name}
          paddingTop={isCanvasVisible ? 50 : 30}
        />
      </div>
    </div>
  );

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      {elBody}
      {debug && size.toElement([4, null, null, 6])}
    </div>
  );
};
