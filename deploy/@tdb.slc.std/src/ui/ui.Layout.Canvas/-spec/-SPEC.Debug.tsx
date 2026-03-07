import React from 'react';
import { type t, Button, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { SampleButtons } from './-ui.buttons.tsx';

type P = t.CanvasLayoutProps;
type Storage = { borderRadius?: number } & Pick<P, 'theme' | 'debug'>;
type ResetDefaults = Storage & Pick<P, 'panels'>;
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  borderRadius: 30,
};
const resetDefaults: ResetDefaults = {
  ...defaults,
  panels: undefined,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    borderRadius: s(snap.borderRadius),
    panels: s<P['panels']>(),
  };
  const p = props;

  /**
   * Persist subsequent changes.
   */
  Signal.effect(() => {
    store.change((d) => {
      d.debug = p.debug.value;
      d.theme = p.theme.value;
      d.borderRadius = p.borderRadius.value;
    });
  });

  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(p, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(resetDefaults, e.path)));
  }

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => `borderRadius: ${p.borderRadius.value ?? D.borderRadius}`}
        onClick={() => Signal.cycle(p.borderRadius, [0, 5, 15, 30])}
      />

      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      <SampleButtons debug={debug} />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={['$']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
