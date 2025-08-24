import React from 'react';
import {
  type t,
  Button,
  css,
  D,
  Immutable,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
} from '../common.ts';

import type { Sample, SampleDoc } from '../-samples/t.ts';

type P = t.SampleReactProps;
type Storage = Pick<P, 'theme' | 'debug' | 'strategy'> & { sample?: Sample };
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  strategy: D.strategy,
  sample: 'Hello World',
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;
export type { Sample };

/**
 * Sample Types:
 */
const SAMPLES: Sample[] = ['Hello World', 'Slots', 'Factory Error', 'State', 'Composed Recursive'];

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;
  const state = Immutable.clonerRef<SampleDoc>({ count: 0 });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    strategy: s(snap.strategy),
    sample: s(snap.sample),

    factory: s<P['factory']>(),
    plan: s<P['plan']>(),
  };
  const p = props;
  const api = {
    props,
    state,
    reset,
    loadSample,
    unloadSample,
    listen() {
      Signal.listen(props);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.strategy = p.strategy.value;
      d.sample = p.sample.value;
    });
  });
  Signal.effect(() => {
    // Hook into values:
    p.theme.value;
    api.loadSample();
  });

  /**
   * Methods:
   */
  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
    state.change((d) => (d.count = 0));
    loadSample();
  }

  function unloadSample() {
    p.factory.value = undefined;
    p.plan.value = undefined;
  }

  async function loadSample(sample: Sample | undefined = p.sample.value) {
    unloadSample();
    p.sample.value = sample;

    const change = (factory: t.Factory, plan: P['plan']) => {
      p.factory.value = factory;
      p.plan.value = plan;
    };

    const load = (await import('./-u.load.ts')).load;
    const res = await load({ state, props }, sample);
    if (res) change(res.factory, res.plan);
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
  const sample = p.sample.value;

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
        label={() => `strategy: ${p.strategy.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle<P['strategy']>(p.strategy, ['suspense', 'eager'])}
      />

      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      {SAMPLES.map((id, i) => {
        return (
          <Button
            block
            key={`${i}.${id}`}
            enabled={() => p.sample.value !== id}
            label={() => `${i + 1}. ${id}`}
            onClick={() => debug.loadSample(id)}
          />
        );
      })}
      <Button
        block
        style={{ marginTop: 5 }}
        label={() => `(clear)`}
        onClick={() => {
          debug.unloadSample();
          p.sample.value = undefined;
        }}
      />

      {sample === 'State' && <DebugStateButtons debug={debug} />}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};

/**
 * State Debug
 */
export function DebugStateButtons(props: { debug: DebugSignals }) {
  const { debug } = props;
  const state = debug.state;

  const [, setRender] = React.useState(0);
  const redraw = () => setRender((n) => n + 1);

  React.useEffect(() => {
    const events = state.events();
    events.$.subscribe(redraw);
    return events.dispose;
  }, [state.instance]);

  const inc = (by: number, label: string) => {
    const current = () => {
      const count = state.current.count ?? 0;
      const sign = by < 0 ? '-' : '+';
      const next = count + by;
      return { count, sign, next };
    };
    return (
      <Button
        block
        label={() => {
          const { count, sign, next } = current();
          return `count.${label} ${count} ${sign} 1 = ${next}`;
        }}
        onClick={() => {
          state.change((d) => (d.count = (d.count ?? 0) + by));
        }}
      />
    );
  };
  return (
    <>
      <hr />
      <div className={Styles.title.class}>
        <div>State</div>
        <div>{'ImmutableRef<T>'}</div>
      </div>
      {inc(1, 'increment:')}
      {inc(-1, 'decrement:')}
    </>
  );
}
