import React from 'react';
import { css, Dev, Signal, type t } from './-spec/common.ts';
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
    lifetime: s<O['lifetime']>(2000),
  };
  const api = {
    props,
    listen() {
      const p = props;
      p.lifetime.value;
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
    title: css({
      fontWeight: 'bold',
      marginBottom: 10,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>
        <div>{'PreloadPortal'}</div>
      </div>

      <Dev.Button
        block
        label={() => {
          const msecs = p.lifetime.value;
          return `lifetime: ${msecs !== undefined ? `${msecs}ms` : '<undefined> (never)'}`;
        }}
        onClick={() => Signal.cycle<O['lifetime']>(p.lifetime, [undefined, 500, 2000])}
      />

      <hr />

      <Dev.Button
        block
        label={() => 'Preload.render( 🌳 )'}
        onClick={async () => {
          const lifetime = p.lifetime.value;
          const el = <div>Hello</div>;
          const name = '🐷-foo';
          const res = await Preload.render(el, { lifetime, name });
          console.info(res);
        }}
      />
    </div>
  );
};
