import type React from 'react';
import { Color, css, D, Dev, LocalStorage, Signal, STORAGE_KEY, type t } from './common.ts';
import { SpecLink } from '../../-ui.Links.tsx';

const defaults: t.DebugValues = { debug: D.debug, theme: 'Dark' };

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals: isolated appearance preferences, not authentication state.
 */
export function createDebugSignals() {
  const store = LocalStorage.immutable<t.DebugValues>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;
  const props = {
    debug: Signal.create(snap.debug),
    theme: Signal.create(snap.theme),
  };
  const p = props;

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
  }

  const dispose = Signal.effect(() => {
    store.change((d) => {
      d.debug = p.debug.value;
      d.theme = p.theme.value;
    });
  });

  return { props, listen, reset, dispose };
}

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    title: css({
      fontWeight: 'bold',
      marginBottom: 4,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>
        <div>{D.name}</div>
        <div>(Sample)</div>
      </div>
      <div>
        <SpecLink to='view' />
      </div>
      <hr />
      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <hr />
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
