import React from 'react';
import { type t, App, AppContent, Button, css, Signal, Str } from './common.ts';
import { pushStackContentButtons, screenBreakpointButton } from '../ui.Layout/-SPEC.tsx';

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals(init?: (e: DebugSignals) => void) {
  type P = t.Landing3Props;
  const s = Signal.create;

  const app = App.signals();
  const props = { debug: s<P['debug']>(true) };
  const api = { app, props };
  app.stack.push(await AppContent.find('Entry'));
  init?.(api);
  return api;
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const app = debug.app;
  const p = app.props;
  const d = debug.props;

  Signal.useRedrawEffect(() => {
    d.debug.value;
    app.listen();
  });

  /**
   * Render:
   */
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
    dist: css({ fontSize: 12 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{'Landing-3'}</div>
      <Button block label={`debug: ${d.debug}`} onClick={() => Signal.toggle(d.debug)} />
      <hr />
      {screenBreakpointButton(app)}
      <Button
        block
        label={`background.video.opacity: ${p.background.video.opacity}`}
        onClick={() => Signal.cycle(p.background.video.opacity, [undefined, 0.15, 0.3, 1])}
      />

      <hr />
      {pushStackContentButtons(app)}

      <hr />
      <pre className={styles.dist.class}>{JSON.stringify(wrangle.dist(app), null, '  ')}</pre>
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  dist(app: t.AppSignals) {
    const dist = app.props.dist.value;
    if (!dist) return { err: 'app.props.dist not found' };
    return {
      'dist:size': Str.bytes(dist.size.bytes),
      'dist:hash:sha256': `#${dist.hash.digest.slice(-5)}`,
    };
  },
} as const;
