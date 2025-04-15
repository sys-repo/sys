import React from 'react';
import { Button } from '../Button/mod.ts';

import { type t, css, Signal } from './common.ts';
import { Preload } from './mod.ts';

type O = t.PreloadOptions;

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
    disposeAfter: s<O['disposeAfter']>(0),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.disposeAfter.value;
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

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
    cols: css({ display: 'grid', gridTemplateColumns: 'auto 1fr auto' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={css(styles.title, styles.cols).class}>
        <div>{'PreloadPortal'}</div>
      </div>

      <Button
        block
        label={() => {
          const msecs = p.disposeAfter.value;
          return `disposeAfter: ${msecs !== undefined ? `${msecs}ms` : '<undefined>'}`;
        }}
        onClick={() => Signal.cycle<O['disposeAfter']>(p.disposeAfter, [undefined, 0, 500, 2000])}
      />

      <hr />

      <Button
        block
        label={() => 'Preload.render'}
        onClick={async () => {
          const disposeAfter = p.disposeAfter.value;
          const el = <div>Hello</div>;
          const res = await Preload.render(el, { disposeAfter });
          console.info(res);
        }}
      />
    </div>
  );
};
