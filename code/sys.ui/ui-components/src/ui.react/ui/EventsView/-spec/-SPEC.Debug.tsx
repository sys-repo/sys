import type React from 'react';
import { Spec } from '../../-test.ui.ts';
import { Color, css, D, Dev, LocalStorage, Num, Obj, Signal, type t } from './common.ts';
import { defaultSample, type SampleId, samples } from './-u.samples.ts';

type Storage = { debug: boolean; theme: t.CommonTheme; mode: t.EventsView.Mode };
const defaults: Storage = { debug: false, theme: 'Dark', mode: D.mode };
const defaultTail = 5;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.Style.Input };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const props = {
    debug: s(snap.debug ?? defaults.debug),
    theme: s(snap.theme),
    mode: s(snap.mode ?? defaults.mode),
    sample: s<SampleId>(defaultSample),
    tail: s<number | undefined>(defaultTail),
    showMessage: s(false),
    customLabels: s(false),
    disclosureOwner: s<'component' | 'host'>('component'),
    expanded: s(false),
    mono: s(false),
  };
  const p = props;
  const { attach } = Spec.attachments({
    shared() {
      store.change((d) => {
        d.debug = p.debug.value;
        d.theme = p.theme.value;
        d.mode = p.mode.value;
      });
    },
  });

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.batch(() => {
      p.debug.value = defaults.debug;
      p.theme.value = defaults.theme;
      p.mode.value = defaults.mode;
      p.sample.value = defaultSample;
      p.tail.value = defaultTail;
      p.showMessage.value = false;
      p.customLabels.value = false;
      p.disclosureOwner.value = 'component';
      p.expanded.value = false;
      p.mono.value = false;
    });
  }

  return { props, listen, reset, attach };
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

      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Dev.Button
        block
        label={() => `mode: ${v.mode}`}
        onClick={() => Signal.cycle(p.mode, ['count', 'list'])}
      />

      <Dev.Button
        block
        label={() => `tail: ${v.tail ?? 'all'}`}
        onClick={() => Signal.cycle(p.tail, [undefined, 0, 1, 2, 5])}
      />
      <Dev.Button
        block
        label={() => `renderItem: ${v.showMessage ? 'message' : 'kind (default)'}`}
        onClick={() => Signal.toggle(p.showMessage)}
      />
      <Dev.Button
        block
        label={() => `labels: ${v.customLabels ? 'custom' : 'default'}`}
        onClick={() => Signal.toggle(p.customLabels)}
      />

      <Dev.Button block label={() => `mono: ${v.mono}`} onClick={() => Signal.toggle(p.mono)} />

      <hr />
      <div className={Styles.title.class}>Sample States</div>
      <Dev.List
        theme={theme.name}
        columns={1}
        selected={v.sample}
        items={Obj.keys(samples).map((id) => ({
          id,
          label: `${samples[id].label} (${Num.toString(samples[id].items.length)})`,
          onActivate: () => p.sample.value = id,
        }))}
      />

      <hr />
      <div className={Styles.title.class}>Debug</div>
      <Dev.Button
        block
        label={v.disclosureOwner === 'host'
          ? 'disclosure owner: host (dev-harness)'
          : 'disclosure owner: component (useState)'}
        onClick={() => Signal.cycle(p.disclosureOwner, ['component', 'host'])}
      />
      {v.disclosureOwner === 'host' && (
        <Dev.Button
          block
          label={`host expanded: ${v.expanded}`}
          onClick={() => Signal.toggle(p.expanded)}
        />
      )}
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView name='debug' data={v} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
