import React, { useRef } from 'react';
import {
  type t,
  Color,
  css,
  LogoCanvas,
  ObjectView,
  Player,
  Playlist,
  Signal,
  useLoading,
  useSizeObserver,
  useVisibilityThresholdY,
} from './common.ts';
import { Calc } from './u.ts';
import { toPlaylist } from './u.playlist.ts';

type P = t.ProgrammeSectionProps;
type Part = 'Canvas';

/**
 * Component:
 */
export const Section: React.FC<P> = (props) => {
  const { content, state, player, debug = false } = props;
  const section = Calc.Section.media(state).section;
  const selected = Calc.Section.index(state).child;

  /**
   * Hooks:
   */
  const playlistRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const loading = useLoading<Part>(['Canvas']);
  const size = useSizeObserver();
  const isReady = size.ready && loading.ready();
  const depsChildren = section?.children?.map((m) => m.id).join('|');
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

  const elDebug = debug && (
    <>
      <ObjectView
        name={'Content:Programme.Section'}
        style={{ Absolute: [null, null, 6, 6] }}
        expand={0}
        data={Signal.toObject({
          player: player.src,
          'state:<ProgrammeSignals>': state.props,
          'content:<ProgrammeContent>': content,
        })}
      />
      {size.toElement([4, null, null, 6])}
      <Player.Timestamp.Elapsed.View player={player} abs={[6, 6, null, null]} />
    </>
  );

  const elBody = (
    <div className={styles.body.class}>
      <div ref={canvasRef} className={styles.canvas.class}>
        <LogoCanvas
          theme={theme.name}
          selected={wrangle.selectedPanel(state)}
          selectionAnimation={false}
          onReady={() => loading.ready('Canvas')}
          onPanelEvent={(e) => console.info(`⚡️ Canvas.onPanelEvent:`, e)}
        />
      </div>
      <div ref={playlistRef} className={styles.playlist.class}>
        <Playlist
          items={toPlaylist(section)}
          theme={theme.name}
          paddingTop={canvas.visible ? 50 : 30}
          selected={selected}
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
      {elDebug}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  selectedPanel(state: t.ProgrammeSignals) {
    const media = Calc.Section.media(state);
    return media.child?.panel ?? media.section?.panel;
  },
} as const;
