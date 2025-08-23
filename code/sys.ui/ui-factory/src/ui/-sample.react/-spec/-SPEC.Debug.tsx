import React from 'react';
import { type t, Button, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';

type P = t.SampleReactProps;
type Storage = Pick<P, 'theme' | 'debug' | 'strategy'> & { sample?: Sample };
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  strategy: D.strategy,
  sample: 'Hello World',
};

const SAMPLES: Sample[] = ['Hello World', '...'];

/**
 * Types:
 */
export type Sample = 'Hello World' | '...';
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
    strategy: s(snap.strategy),
    sample: s(snap.sample),

    factory: s<P['factory']>(),
    plan: s<P['plan']>(),
  };
  const p = props;
  const api = {
    props,
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

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
    loadSample();
  }

  function unloadSample() {
    p.factory.value = undefined;
    p.plan.value = undefined;
  }
  async function loadSample(sample: Sample | undefined = p.sample.value) {
    unloadSample();
    p.sample.value = sample;

    if (sample === 'Hello World') {
      const { plan, factory } = await import('../-samples/hello.tsx');
      p.factory.value = factory;
      p.plan.value = plan;
    }
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
        label={() => `strategy: ${p.strategy.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle<P['strategy']>(p.strategy, ['suspense', 'eager'])}
      />

      <hr />
      {SAMPLES.map((id, i) => {
        return (
          <Button
            block
            key={`${i}.${id}`}
            label={() => `Sample-${i + 1}: ${id}`}
            onClick={() => debug.loadSample(id)}
          />
        );
      })}
      <Button
        block
        label={() => `(clear)`}
        onClick={() => {
          debug.unloadSample();
          p.sample.value = undefined;
        }}
      />

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
