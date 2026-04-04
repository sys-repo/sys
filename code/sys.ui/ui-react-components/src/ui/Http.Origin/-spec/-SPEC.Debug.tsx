import React from 'react';
import { type t, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';
import { HttpOrigin } from '../mod.ts';
import { type SampleName, Sample } from './-samples.ts';
import { SampleValue } from './-ui.Sample.Value.tsx';

type P = t.HttpOrigin.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'env'> & {
  verify?: boolean;
  controlled?: boolean;
  sample?: SampleName;
  width?: t.Pixels;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  env: 'localhost',
  verify: false,
  controlled: true,
  sample: 'cdn',
  width: 350,
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

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    env: s(snap.env),
    verify: s(snap.verify ?? false),
    controlled: s(snap.controlled),
    sample: s(snap.sample ?? defaults.sample),
    width: s(snap.width),
  };
  const p = props;
  const controller = HttpOrigin.controller({ env: p.env });
  const api = {
    props,
    controller,
    listen,
    reset,
    sample,
  };

  function listen() {
    Signal.listen(props, true);
    controller.listen();
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  function sample() {
    const key = p.sample.value;
    return key ? Sample[key] : undefined;
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.env = p.env.value;
      d.verify = p.verify.value;
      d.controlled = p.controlled.value;
      d.sample = p.sample.value;
      d.width = p.width.value;
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
  const ctrl = debug.controller;
  const p = debug.props;
  const v = Signal.toObject(p);
  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
    vcenter: css({ display: 'flex', alignItems: 'center', gap: 6 }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `controlled: ${p.controlled.value}`}
        onClick={() => Signal.toggle(p.controlled)}
      />
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `env: ${p.env.value}`}
        onClick={() => Signal.cycle<t.HttpOrigin.Env>(p.env, ['localhost', 'production'])}
      />

      <Button
        block
        label={() => `sample: ${p.sample.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<SampleName | undefined>(p.sample, ['cdn', 'media', undefined])}
      />
      <Button
        block
        label={() => `verify: ${p.verify.value}`}
        onClick={() => Signal.toggle(p.verify)}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button
        block
        label={() => `width: ${p.width.value}px`}
        onClick={() => Signal.cycle<t.Pixels>(p.width, [280, 350, 420])}
      />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView
        name={`controller:rev:${ctrl.rev}`}
        data={Signal.toObject(ctrl, { func: false })}
        style={{ marginTop: 6 }}
        expand={1}
      />
      <ObjectView
        name={`debug.sample:${v.sample}`}
        data={debug.sample()}
        style={{ marginTop: 6 }}
        expand={1}
      />

      <hr style={{ margin: '15px 0 20px 0' }} />
      <HttpOrigin.UI.Controlled
        debug={v.debug}
        spec={debug.sample()}
        env={p.env}
        verify={v.verify ? true : undefined}
      />

      <hr style={{ margin: '15px 0 20px 0' }} />
      <div className={Styles.title.class}>{'Samples: <Value>'}</div>
      <SampleValue theme={theme.name} />

      <hr style={{ margin: '15px 0 20px 0' }} />
      <Button
        block
        label={() => `tmp-🐷`}
        onClick={async () => {
          const origin = ctrl.state.origin.value;
          const state = Signal.toObject(ctrl.state);
          if (origin) {
            // 🐷
            console.info('controller.state', state);
          }
        }}
      />
    </div>
  );
};
