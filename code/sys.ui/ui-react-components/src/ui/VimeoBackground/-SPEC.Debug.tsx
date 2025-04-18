import React from 'react';
import { VIMEO } from '../-test.ui.ts';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, Signal, DEFAULTS, D } from './common.ts';

type P = t.VimeoBackgroundProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
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
    playingTransition: s<P['playingTransition']>(),
    jumpTo: s<P['jumpTo']>(),
    vimeo: s<t.VimeoIFrame>(),
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
      p.playingTransition.value;
      p.jumpTo.value;
      p.vimeo.value;
    },
  };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

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

      <hr />
      <Button
        block
        label={`playing: ${p.playing.value}`}
        onClick={() => Signal.toggle(p.playing)}
      />
      <Button
        block
        label={() => {
          const v = p.playingTransition.value;
          return `playingTransition (ms): ${v ?? `<undefined> (${D.playingTransition})`}`;
        }}
        onClick={() => {
          Signal.cycle<P['playingTransition']>(p.playingTransition, [1000, 2000, undefined]);
        }}
      />
      <Button
        block
        label={`jumpTo: ${p.jumpTo.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<P['jumpTo']>(p.jumpTo, [undefined, 0, 10]);
        }}
      />

      <hr />
      <div className={styles.title.class}>{`video: ${p.video.value}`}</div>
      {srcVideo('app/tubes')}
      {srcVideo('stock/running')}
      {srcVideo('public/helvetica')}

      <hr />

      <div className={styles.title.class}>API</div>

      <Button
        block
        label={`get: current time (seconds)`}
        onClick={async () => {
          const api = p.vimeo.value;
          console.info('get.time:', await api?.get.time());
        }}
      />
    </div>
  );
};
