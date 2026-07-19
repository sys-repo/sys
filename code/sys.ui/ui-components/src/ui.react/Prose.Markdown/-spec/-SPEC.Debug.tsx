import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { Color, css, D, LocalStorage, Signal, type t } from '../common.ts';
import { MarkdownSample, type SampleKind } from './-samples.ts';
import { Sample } from './-ui.Sample.tsx';

type P = t.ProseMarkdown.Props;
type Storage = Pick<P, 'debug' | 'theme'> & { sample?: SampleKind };

const defaultSample: SampleKind = 'intro';
const defaults: Storage = {
  debug: false,
  theme: 'Light',
  sample: defaultSample,
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
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;
  const sample = MarkdownSample.resolveKind(snap.sample, defaultSample);

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    sample: s(sample),
    value: s(MarkdownSample.value(sample)),
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
    p.debug.value = defaults.debug;
    p.theme.value = defaults.theme;
    p.sample.value = defaultSample;
    p.value.value = MarkdownSample.value(defaultSample);
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.sample = p.sample.value;
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

      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      <Sample.Buttons debug={debug} />

      <hr />
      <div className={Styles.title.class}>{'Debug:'}</div>
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
