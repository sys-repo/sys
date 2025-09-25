import React from 'react';
import {
  type t,
  Button,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Schedule,
  Signal,
} from './common.ts';

type Storage = { theme?: t.CommonTheme };
const defaults: Storage = {
  theme: 'Dark',
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
    theme: s(snap.theme),
    marks: s<TMarks>(),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
    async run() {
      p.marks.value = await run();
    },
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
    });
  });

  Schedule.frames(2).then(api.run);
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
      <div className={Styles.title.class}>
        <div>{D.name}</div>
        <div>{'Timer'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button block label={() => `run`} onClick={() => debug.run()} />

      <hr />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};

/**
 * Helpers:
 */
type TMarks = Array<[string, number]>;
export async function run() {
  const marks: TMarks = [];
  const t = () => Math.round(performance.now());

  // Schedule callbacks to observe actual turn order:
  Schedule.micro(() => marks.push(['cb:micro', t()]));
  Schedule.macro(() => marks.push(['cb:macro', t()]));
  Schedule.raf(() => marks.push(['cb:raf', t()]));

  // Await sequence:
  const t0 = t();
  await Schedule.micro();
  marks.push(['await:micro', t()]);
  await Schedule.macro();
  marks.push(['await:macro', t()]);
  await Schedule.frames(2);
  marks.push(['await:frames(2)', t()]);

  console.table(
    marks.map(([tag, tAbs]) => {
      const [phase, mode] = tag.split(':'); // e.g. "cb" | "await", "micro" | "macro" | "raf" | "frames(2)"
      return {
        phase,
        mode,
        'Δt (ms)': +(tAbs - t0).toFixed(2),
        't (ms)': +tAbs.toFixed(2),
      };
    }),
  );
  return marks;
}
