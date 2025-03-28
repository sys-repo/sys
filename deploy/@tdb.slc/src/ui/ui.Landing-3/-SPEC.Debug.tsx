import React from 'react';
import { type t, App, Button, Color, css, Signal, Str } from './common.ts';

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

  const props = {
    debug: s<P['debug']>(true),
    signals: App.signals(),
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
  const d = ctx.debug.props;
  const p = d.signals.props;

  Signal.useRedrawEffect(() => {
    d.debug.value;
    d.signals.listen();
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

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'Landing-3'}</div>
      <Button block label={`debug: ${d.debug}`} onClick={() => Signal.toggle(d.debug)} />
      <Button
        block
        label={`theme: "${p.theme}"`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <hr />
      <Button
        block
        label={`stage: "${p.stage}"`}
        onClick={() => {
          Signal.cycle<t.Stage>(p.stage, ['Entry', 'Trailer', 'Overview', 'Programme']);
        }}
      />
      <Button
        block
        label={`backgroundVideoOpacity: ${p.background.video.opacity}`}
        onClick={() => Signal.cycle(p.background.video.opacity, [undefined, 0.15, 0.3, 1])}
      />

      <hr />

      <Button
        block
        label={`API.video.playing: ${p.video.props.playing}`}
        onClick={() => Signal.toggle(p.video.props.playing)}
      />

      <hr />
      <pre className={styles.dist.class}>{JSON.stringify(wrangle.dist(d.signals), null, '  ')}</pre>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  dist(signals: t.AppSignals) {
    const dist = signals.props.dist.value;
    if (!dist) return {};
    return {
      'dist:size': Str.bytes(dist.size.bytes),
      'dist:hash:sha256': `#${dist.hash.digest.slice(-5)}`,
    };
  },
} as const;
