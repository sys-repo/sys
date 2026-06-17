import React from 'react';
import {
  Button,
  Color,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  STORAGE_KEY,
  type t,
} from './common.ts';
import { SAMPLE, type SampleKind, type SampleValues } from './-samples.ts';

type P = t.KeyValueSwitches.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'enabled'> & {
  sample?: SampleKind;
  values?: SampleValues;
};

const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  enabled: true,
  sample: 'basic',
  values: { ...SAMPLE.defaultValues },
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    enabled: s(snap.enabled),
    sample: s(snap.sample),
    values: s<SampleValues>({ ...SAMPLE.defaultValues, ...(snap.values ?? {}) }),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    p.values.value = { ...SAMPLE.defaultValues };
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.enabled = p.enabled.value;
      d.sample = p.sample.value;
      d.values = p.values.value;
    });
  });

  return api;
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 4,
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
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `enabled: ${v.enabled}`}
        onClick={() => Signal.toggle(p.enabled)}
      />

      <hr />
      <div className={Styles.title.class}>{'Samples'}</div>
      <Button block label={() => `sample: basic`} onClick={() => (p.sample.value = 'basic')} />
      <Button block label={() => `sample: mixed`} onClick={() => (p.sample.value = 'mixed')} />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
