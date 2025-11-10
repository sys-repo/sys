import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, LocalStorage, Obj, Signal } from '../common.ts';

type P = t.CompositeVideoProps;
type Storage = Pick<P, 'debug' | 'theme' | 'spec'>;
const defaults: Storage = {
  spec: undefined,
  theme: 'Dark',
  debug: false,
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
    spec: s(snap.spec),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
  };

  function listen() {
    Signal.listen(props, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.spec = p.spec.value;
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
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <div className={Styles.title.class}>{'video/specs:'}</div>
      <Button block label={() => `(clear)`} onClick={() => (p.spec.value = undefined)} />
      <Button
        block
        label={() => `sample-1`}
        onClick={() => {
          const base = 'https://fs.socialleancanvas.com';
          p.spec.value = [
            {
              src: `${base}/video/v2/core/sha256-3ee12096a189525fcbb0e85d1781fc414e46e8c306b6ee170af17fe8bd2b11c7.webm`,
              slice: '00:00:00..00:00:08',
            },
            {
              src: `${base}/video/v2/core/sha256-4f389f967e94fd9838d84619aaf06f68f984e2f7a6d40637df13a65476d047f9.webm`,
              slice: '00:00:02..00:00:10',
            },
          ] satisfies t.VideoCompositionSpec;
        }}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
    </div>
  );
};
