import React from 'react';
import { type t, Button, Color, createSignals, css, Signal, Str } from './common.ts';

/**
 * Types:
 */
export type DebugProps = { ctx: { debug: DebugSignals }; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals(init?: (e: DebugSignals) => void) {
  type P = t.Landing3Props;
  const s = Signal.create;

  const signals = createSignals();

  const props = {
    signals,
    debug: s<P['debug']>(true),
    theme: s<P['theme']>('Dark'),
    backgroundVideoOpacity: s<P['backgroundVideoOpacity']>(0.15),
  };
  const api = { props };
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { ctx } = props;
  const p = ctx.debug.props;

  Signal.useRedrawEffect(() => {
    p.theme.value;
    p.debug.value;
    p.backgroundVideoOpacity.value;
    p.signals.listen();
  });

  /**
   * Render:
   */
  const theme = Color.theme(p.theme.value);
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
    dist: css({ fontSize: 12 }),
  };

  // const dist = p.signals.dist

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'Landing-3'}</div>
      <Button block label={`debug: ${p.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button
        block
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <hr />
      <Button
        block
        label={`stage: "${p.signals.stage}"`}
        onClick={() => {
          Signal.cycle<t.Stage>(p.signals.stage, ['Entry', 'Trailer', 'Overview', 'Programme']);
        }}
      />
      <Button
        block
        label={`backgroundVideoOpacity: ${p.backgroundVideoOpacity}`}
        onClick={() => Signal.cycle(p.backgroundVideoOpacity, [undefined, 0.15, 0.3, 1])}
      />

      <hr />

      <Button
        block
        label={`playing: ${p.signals.video.props.playing}`}
        onClick={() => Signal.toggle(p.signals.video.props.playing)}
      />

      <hr />
      <pre className={styles.dist.class}>{JSON.stringify(wrangle.dist(p.signals), null, '  ')}</pre>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  dist(signals: t.SlcSignals) {
    const d = signals.dist.value;
    if (!d) return {};

    return {
      'dist:size': Str.bytes(d.size.bytes),
      'dist:hash:sha256': d.hash.digest.slice(-10),
    };
  },
} as const;
