import React from 'react';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, DEFAULTS, Signal } from './common.ts';

/**
 * Types
 */
export type DebugProps = {
  ctx: { video: t.VideoPlayerSignals; debug: DebugSignals };
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
export type DebugSignals = ReturnType<typeof createDebugSignals>;
type P = DebugProps;

/**
 * Signals
 */
export function createDebugSignals() {
  const props = { theme: Signal.create<t.CommonTheme>('Light') };
  const api = { props };
  return api;
}

/**
 * Component
 */
export const Debug: React.FC<P> = (props) => {
  const { ctx } = props;
  const p = ctx.video.props;
  const d = ctx.debug.props;

  Signal.useRedrawEffect(() => {
    p.ready.value;
    p.loop.value;
    p.playing.value;
    p.showControls.value;
    p.showFullscreenButton.value;
    p.cornerRadius.value;
    p.aspectRatio.value;
    p.muted.value;
    p.autoPlay.value;
  });

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block={true}
        label={`method: jumpTo(12, play)`}
        onClick={() => ctx.video.jumpTo(12)}
      />
      <Button
        block={true}
        label={`method: jumpTo(12, paused)`}
        onClick={() => ctx.video.jumpTo(12, { play: false })}
      />

      <hr />

      <Button block={true} label={`playing: ${p.playing}`} onClick={() => toggle(p.playing)} />
      <Button block={true} label={`muted: ${p.muted}`} onClick={() => toggle(p.muted)} />
      <Button block={true} label={`autoplay: ${p.autoPlay}`} onClick={() => toggle(p.autoPlay)} />
      <Button block={true} label={`loop: ${p.loop}`} onClick={() => toggle(p.loop)} />

      <hr />

      <Button
        block={true}
        label={`showControls: ${p.showControls}`}
        onClick={() => toggle(p.showControls)}
      />
      <Button
        block={true}
        label={`showFullscreenButton: ${p.showFullscreenButton}`}
        onClick={() => toggle(p.showFullscreenButton)}
      />
      <Button
        block={true}
        label={`cornerRadius: ${p.cornerRadius}`}
        onClick={() => Signal.cycle(p.cornerRadius, [0, 5, DEFAULTS.cornerRadius, 15])}
      />
      <Button
        block={true}
        label={`aspectRatio: ${p.aspectRatio}`}
        onClick={() => Signal.cycle(p.aspectRatio, [DEFAULTS.aspectRatio, '4/3', '2.39/1', '1/1'])}
      />
    </div>
  );
};

/**
 * Helpers
 */
const toggle = (signal: t.Signal<boolean>) => (signal.value = !signal.value);
