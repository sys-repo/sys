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
import { SAMPLE, type SampleKind, type SampleValues } from './-samples.tsx';

type P = t.KeyValueSwitches.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'enabled'> & {
  reorder: boolean;
  sample?: SampleKind;
  values?: SampleValues;
};

const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  enabled: true,
  reorder: false,
  sample: 'basic',
  values: { ...SAMPLE.defaultValues },
};

/**
 * Debug component props.
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };

/**
 * Debug signal bundle.
 */
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Create the debug harness signals.
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    enabled: s(snap.enabled ?? true),
    reorder: s(snap.reorder ?? false),
    sample: s(snap.sample),
    items: s<t.KeyValueSwitches.Item[]>(SAMPLE.source(snap.sample)),
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
    p.items.value = SAMPLE.source(defaults.sample);
    p.values.value = { ...SAMPLE.defaultValues };
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.enabled = p.enabled.value;
      d.reorder = p.reorder.value;
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
 * Debug controls for the KeyValue.Switches spec.
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  const selectSample = (sample: SampleKind) => {
    p.sample.value = sample;
    p.items.value = SAMPLE.source(sample);
  };

  // Render.
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
      <Button
        block
        label={() => `reorder: ${v.reorder}`}
        onClick={() => Signal.toggle(p.reorder)}
      />

      <hr />
      <div className={Styles.title.class}>{'Samples'}</div>
      <Button block label={() => `sample: basic`} onClick={() => selectSample('basic')} />
      <Button block label={() => `sample: mixed`} onClick={() => selectSample('mixed')} />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
