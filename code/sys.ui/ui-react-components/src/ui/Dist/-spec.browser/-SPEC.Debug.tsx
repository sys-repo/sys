import React from 'react';
import { SAMPLE, SAMPLE_FILES_MODES, type SampleFilesMode } from '../-spec/-SAMPLE.dist.json.ts';
import { Button, ObjectView } from '../../u.ts';
import { Color, css, D, LocalStorage, Obj, Pkg, Signal, type t } from '../common.ts';
import { Dist } from '../mod.ts';

type P = t.Dist.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'dist'> & {
  sampleFilesMode?: SampleFilesMode;
};
const defaults: Storage = {
  debug: false,
  sampleFilesMode: 'short',
  theme: 'Dark',
  dist: SAMPLE.HelloWorld(),
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
    sampleFilesMode: s(snap.sampleFilesMode),
    theme: s(snap.theme),
    dist: s(snap.dist),
  };
  const p = props;
  const api = {
    props,
    updateDist,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  function updateDist() {}

  Signal.effect(() => {
    store.change((d) => {
      d.debug = p.debug.value;
      d.sampleFilesMode = p.sampleFilesMode.value;
      d.theme = p.theme.value;
      d.dist = p.dist.value;
    });
  });

  Signal.effect(() => {
    const files = p.sampleFilesMode.value;
    p.dist.value = SAMPLE.HelloWorld({ files });
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
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <div className={Styles.title.class}>
        <div>{'Samples'}</div>
        <div>{`dist.json`}</div>
      </div>
      <Button
        block
        label={() => `👋 hello world`}
        onClick={() => (p.dist.value = SAMPLE.HelloWorld())}
      />
      <Button block label={() => `(undefined)`} onClick={() => (p.dist.value = undefined)} />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView name={'Pkg.Dist'} data={Pkg.Dist} expand={0} style={{ marginTop: 5 }} />

      <Dist.UI debug={v.debug} dist={v.dist} style={{ height: 300, marginTop: 50 }} />
    </div>
  );
};
