import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, DEFAULTS, Signal } from './common.ts';

/**
 * Types:
 */
export type DebugProps = {
  ctx: { debug: DebugSignals; video: t.VideoPlayerSignals };
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const props = {};
  const api = { props };
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { ctx } = props;
  const video = ctx.video;
  const d = ctx.debug.props;
  const p = video.props;

  Signal.useRedrawEffect(() => {
    p.ready.value;

    // Media.
    p.src.value;
    p.playing.value;
    p.muted.value;
    p.autoPlay.value;
    p.loop.value;

    // Appearance.
    p.showControls.value;
    p.showFullscreenButton.value;
    p.background.value;
    p.cornerRadius.value;
    p.aspectRatio.value;

    // Commands.
    p.jumpTo.value;
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button block label={`method: jumpTo(12, play)`} onClick={() => video.jumpTo(12)} />
      <Button
        block
        label={`method: jumpTo(12, paused)`}
        onClick={() => video.jumpTo(12, { play: false })}
      />
      <hr />
      <Button block label={`playing: ${p.playing}`} onClick={() => Signal.toggle(p.playing)} />
      <Button block label={`muted: ${p.muted}`} onClick={() => Signal.toggle(p.muted)} />
      <Button block label={`autoplay: ${p.autoPlay}`} onClick={() => Signal.toggle(p.autoPlay)} />
      <Button block label={`loop: ${p.loop}`} onClick={() => Signal.toggle(p.loop)} />
      <Button
        block
        label={`background: ${p.background} ← ${p.background.value ? 'fill' : 'fixed-size'}`}
        onClick={() => Signal.toggle(p.background)}
      />
      <hr />
      <Button
        block
        label={`showControls: ${p.showControls}`}
        onClick={() => Signal.toggle(p.showControls)}
      />
      <Button
        block
        label={`showFullscreenButton: ${p.showFullscreenButton}`}
        onClick={() => Signal.toggle(p.showFullscreenButton)}
      />
      <Button
        block
        label={`cornerRadius: ${p.cornerRadius}`}
        onClick={() => Signal.cycle(p.cornerRadius, [0, 5, 10, 15])}
      />
      <Button
        block
        label={`aspectRatio: ${p.aspectRatio}`}
        onClick={() => Signal.cycle(p.aspectRatio, [DEFAULTS.aspectRatio, '4/3', '2.39/1', '1/1'])}
      />

      <hr />

      <Button
        block
        label={`src: ${p.src}`}
        onClick={() =>
          Signal.cycle(p.src, [
            DEFAULTS.video, // Tubes.
            'vimeo/727951677', // Rowan: "group scale",
          ])
        }
      />

      <hr />
    </div>
  );
};
