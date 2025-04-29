import React, { useRef } from 'react';
import {
  type t,
  Color,
  css,
  LogoCanvas,
  Playlist,
  useLoading,
  useSizeObserver,
  useVisibilityThresholdY,
} from './common.ts';
import { toSectionPlaylist } from './u.ts';

type P = t.ProgrammeSectionProps;
type Part = 'Canvas';

/**
 * Component:
 */
export const Section: React.FC<P> = (props) => {
  const { media, debug = false } = props;

  const playlistRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const loading = useLoading<Part>(['Canvas']);
  const size = useSizeObserver();
  const isReady = size.ready && loading.ready();
  const depsChildren = media?.children?.map((m) => m.id).join('|');
  const canvas = useVisibilityThresholdY(
    {
      refs: [canvasRef, playlistRef],
      containerReady: isReady,
      containerHeight: size.height,
      offsetY: 30,
    },
    [depsChildren],
  );

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
      position: 'relative',
      display: 'grid',
      alignContent: 'start',
      overflow: 'hidden',
    }),
    canvas: css({
      Padding: [35, '18%', 0, '18%'],
      Absolute: canvas.visible ? undefined : [-9999, null, null, -9999],
    }),
    playlist: css({
      MarginX: [85, 50],
    }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <div ref={canvasRef} className={styles.canvas.class}>
        <LogoCanvas
          theme={theme.name}
          selected={wrangle.selectedPanel(props)}
          selectionAnimation={false}
          onReady={() => loading.ready('Canvas')}
          onPanelEvent={(e) => console.info(`⚡️ Canvas.onPanelEvent:`, e)}
        />
      </div>
      <div ref={playlistRef} className={styles.playlist.class}>
        <Playlist
          items={toSectionPlaylist(media)}
          theme={theme.name}
          paddingTop={canvas.visible ? 50 : 30}
          selected={props.selected}
          onChildSelect={(e) => {
            const { index } = e;
            props.onSelect?.({ index });
          }}
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

/**
 * Helpers:
 */
const wrangle = {
  selectedPanel(props: P) {
    const { media, selected } = props;
    const child = typeof selected === 'number' ? media?.children?.[selected] : undefined;
    return child?.panel ?? media?.panel;
  },
} as const;
