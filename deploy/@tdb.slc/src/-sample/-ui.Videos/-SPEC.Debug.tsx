import React from 'react';
import { type t, Button, Color, css, Player, Signal, VIDEO } from './common.ts';

/**
 * Types:
 */
export type DebugProps = { ctx: { debug: DebugSignals }; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = DebugProps;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;
  const video = Player.Video.signals({
    src: VIDEO.Trailer.src, // Rowan: "group scale",
    cornerRadius: 0,
  });
  const props = {
    theme: s<t.CommonTheme>('Light'),
    video,
  };

  const api = { props };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<P> = (props) => {
  const { ctx } = props;
  const p = ctx.debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.video.props.src.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({ color: theme.fg }),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
  };

  const selectVideo = (label: string, src: string) => {
    const s = p.video.props;
    const isCurrent = s.src.value === src;
    const styles = {
      base: css({ display: 'grid', gridTemplateColumns: `1fr auto`, marginLeft: 15 }),
      label: css({ color: isCurrent ? Color.BLUE : undefined }),
    };
    return (
      <Button block onClick={() => (s.src.value = src)}>
        <div className={styles.base.class}>
          <div className={styles.label.class}>{label}</div>
          <div>{src}</div>
        </div>
      </Button>
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <div className={styles.title.class}>Videos</div>
      {selectVideo('Trailer', VIDEO.Trailer.src)}
      {selectVideo('Overview', VIDEO.Overview.src)}
      <hr />
      {selectVideo('ref: "Group Scale"', VIDEO.GroupScale.src)}
    </div>
  );
};
