import React from 'react';
import { VIMEO } from '../-test.ui.ts';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, Signal, DEFAULTS } from './common.ts';

type P = t.VimeoBackgroundProps;

/**
 * Types:
 */
export type DebugProps = { ctx: { debug: DebugSignals }; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  const s = Signal.create;
  const props = {
    theme: s<P['theme']>('Light'),
    video: s<P['video']>(VIMEO['app/tubes']),
    blur: s<P['blur']>(),
    opacity: s<P['opacity']>(),
    playing: s<P['playing']>(DEFAULTS.playing),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.theme.value;
      p.video.value;
      p.opacity.value;
      p.blur.value;
      p.playing.value;
    },
  };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { ctx } = props;
  const debug = ctx.debug;
  const p = ctx.debug.props;

  Signal.useRedrawEffect(() => {
    debug.listen();
  });

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({ color: theme.fg }),
    title: css({ fontWeight: 'bold' }),
  };

  const srcVideo = (key?: keyof typeof VIMEO) => {
    const id = key ? VIMEO[key] : undefined;
    return (
      <Button
        block
        label={key ?? '<undefined>'}
        onClick={() => {
          p.video.value = id; // NB: both valid input.
          p.video.value = `vimeo/${id}`;
        }}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        block
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={`opacity: ${p.opacity.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<P['opacity']>(p.opacity, [undefined, 0, 0.5, 1]);
        }}
      />
      <Button
        block
        label={`blur: ${p.blur.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<P['blur']>(p.blur, [undefined, 5, 15, 60]);
        }}
      />

      <Button
        block
        label={`playing: ${p.playing.value}`}
        onClick={() => Signal.toggle(p.playing)}
      />

      <hr />
      <div className={styles.title.class}>{`video: ${p.video.value}`}</div>
      {srcVideo('app/tubes')}
      {srcVideo('stock/running')}
      {srcVideo('public/helvetica')}
      <hr />
    </div>
  );
};
