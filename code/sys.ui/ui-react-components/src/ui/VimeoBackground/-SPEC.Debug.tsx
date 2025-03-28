import React from 'react';
import { VIMEO } from '../-test.ui.ts';
import { Button } from '../Button/mod.ts';
import { type t, Color, css, Signal } from './common.ts';

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
  const props = {
    theme: s<t.CommonTheme>('Light'),
    video: s<t.VimeoBackgroundProps['video']>(VIMEO['app/tubes']),
    blur: s<t.VimeoBackgroundProps['blur']>(),
    opacity: s<t.VimeoBackgroundProps['opacity']>(),
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
    p.video.value;
    p.opacity.value;
    p.blur.value;
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
        block={true}
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block={true}
        label={`opacity: ${p.opacity.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<t.VimeoBackgroundProps['opacity']>(p.opacity, [undefined, 0, 0.5, 1]);
        }}
      />
      <Button
        block={true}
        label={`blur: ${p.blur.value ?? '<undefined>'}`}
        onClick={() => {
          Signal.cycle<t.VimeoBackgroundProps['blur']>(p.blur, [undefined, 5, 15, 60]);
        }}
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
