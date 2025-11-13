import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, LocalStorage, Obj, Signal } from '../common.ts';
import { Num } from '../../common.ts';

type P = t.RectStackProps;
type Storage = Pick<
  P,
  | 'debug'
  | 'theme'
  | 'mode'
  | 'activeIndex'
  | 'minColumnWidth'
  | 'gap'
  | 'aspectRatio'
  | 'activeIndex'
>;
const defaults: Storage = {
  debug: true,
  theme: 'Dark',
  mode: D.mode,
  gap: D.gap,
  activeIndex: D.activeIndex,
  aspectRatio: D.aspectRatio,
  minColumnWidth: D.minColumnWidth,
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
    mode: s(snap.mode),
    activeIndex: s(snap.activeIndex),
    aspectRatio: s(snap.aspectRatio),
    minColumnWidth: s(snap.minColumnWidth),
    gap: s(snap.gap),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
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
      d.debug = p.debug.value;

      d.mode = p.mode.value;
      d.activeIndex = p.activeIndex.value;
      d.aspectRatio = p.aspectRatio.value;
      d.minColumnWidth = p.minColumnWidth.value;
      d.gap = p.gap.value;
    });
  });

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
      <div className={Styles.title.class}>
        <div>{D.name}</div>
        <div>{'( Layout )'}</div>
      </div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `activeIndex: ${p.activeIndex.value}`}
        onClick={() => Signal.cycle(p.activeIndex, [0, 1, 2, 3, 4])}
      />
      <hr />

      <Button
        block
        label={() => `mode: ${v.mode ?? `(undefined) ← default: ${D.mode}`}`}
        onClick={() => Signal.cycle<t.RectStackMode>(p.mode, ['stream', 'stack', 'grid'])}
      />
      <Button
        block
        label={() =>
          `minColumnWidth: ${v.minColumnWidth ?? `(undefined) ← default: ${D.minColumnWidth}`}`
        }
        onClick={() => {
          Signal.cycle(p.minColumnWidth, [
            D.minColumnWidth, // default 280
            180,
            220,
            320,
            400,
          ]);
        }}
      />
      <Button
        block
        label={() => {
          const value = v.aspectRatio ? Num.round(v.aspectRatio, 2) : v.aspectRatio;
          return `aspectRatio: ${value ?? '(undefined)'}`;
        }}
        onClick={() => {
          Signal.cycle(p.aspectRatio, [
            D.aspectRatio, // undefined by your choice
            1, //             1:1 square
            4 / 3, //         classic ratio
            16 / 9, //        HD video
            9 / 16, //        portrait
            21 / 9, //        ultra-wide
          ]);
        }}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
