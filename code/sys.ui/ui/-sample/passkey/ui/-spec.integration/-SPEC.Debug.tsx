import React from 'react';
import type { openSample } from '../../ui.host/u.sample.ts';
import { contextOf } from '../../ui.host/u.snapshot.ts';
import { Passkey } from '../mod.ts';
import { Color, css, D, Dev, LocalStorage, Signal, STORAGE_KEY, type t } from './common.ts';
import { SpecLink } from '../-spec/-ui.Links.tsx';
import { ViewPicker } from '../-spec/-ui.ViewPicker.tsx';

const defaults: t.DebugValues = { debug: D.debug, theme: 'Dark' };

/**
 * Types:
 */
export type DebugProps = {
  debug: DebugSignals;
  sample: Pick<ReturnType<typeof openSample>, 'current' | 'subscribe'>;
  style?: t.Style.Input;
};
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Theme/debug persist; the selected view is ephemeral.
 */
export function createDebugSignals() {
  const store = LocalStorage.immutable<t.DebugValues>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;
  const props = {
    debug: Signal.create(snap.debug),
    theme: Signal.create(snap.theme),
    view: Signal.create<t.Passkey.View>(D.view),
  };
  const p = props;

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
    p.view.value = D.view;
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
  const { debug, sample } = props;
  const browser = React.useSyncExternalStore(sample.subscribe, () => sample.current().browser);
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    context: css({ marginBottom: 22 }),
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
        <div>WebAuthn · W3C</div>
      </div>
      <Passkey.UI.Context context={contextOf(browser)} style={styles.context} />
      <SpecLink to='view' />
      <hr />
      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <hr />
      <div className={styles.title.class}>Presentation</div>
      <ViewPicker view={v.view} theme={theme.name} onSelect={(view) => p.view.value = view} />
      <hr />
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
