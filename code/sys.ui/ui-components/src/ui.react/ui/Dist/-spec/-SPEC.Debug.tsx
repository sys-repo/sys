import React from 'react';
import { Spec } from '../../-test.ui.ts';
import { Color, css, D, Dev, LocalStorage, Obj, Pkg, Signal, type t } from './common.ts';
import { Dist } from '../mod.ts';
import { SAMPLE, SAMPLE_FILES_MODES, type SampleFilesMode } from './-SAMPLE.dist.json.ts';

type DebugView = (typeof VIEW_MODES)[number];
const VIEW_MODES = ['UI', 'UI.Browser'] as const;

type P = t.Dist.Props;
type Storage = Pick<P, 'debug' | 'theme' | 'dist'> & {
  debugView?: DebugView;
  sampleFilesMode?: SampleFilesMode;
};
const defaults: Storage = {
  debug: false,
  debugView: 'UI',
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
    debugView: s(snap.debugView),
    sampleFilesMode: s(snap.sampleFilesMode),

    theme: s(snap.theme),
    dist: s(snap.dist),
  };
  const p = props;
  let sample = { files: p.sampleFilesMode.value, view: p.debugView.value };
  // Preserve factory-time normalization without starting automatic work before attachment.
  p.dist.value = SAMPLE.HelloWorld({ files: sample.files });

  const { attach } = Spec.attachments({
    shared(e) {
      // Independent dependencies: projecting dist must not regenerate an explicit selection.
      const effects = Signal.listeners(e.life);
      effects.effect(syncSample);
      effects.effect(() => {
        store.change((d) => {
          d.debug = p.debug.value;
          d.debugView = p.debugView.value;
          d.sampleFilesMode = p.sampleFilesMode.value;
          d.theme = p.theme.value;
          d.dist = p.dist.value;
        });
      });
    },
  });

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    selectDist(p.dist.value);
  }

  function updateDist() {}

  function selectDist(dist: P['dist']) {
    // Explicit selections supersede earlier detached driver changes.
    sample = { files: p.sampleFilesMode.value, view: p.debugView.value };
    p.dist.value = dist;
  }

  function syncSample() {
    const files = p.sampleFilesMode.value;
    const view = p.debugView.value;
    if (files === sample.files && view === sample.view) return;
    selectDist(SAMPLE.HelloWorld({ files }));
  }

  return { props, listen, reset, updateDist, selectDist, attach };
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

      <Dev.Button
        block
        label={() => `view: ${p.debugView.value}`}
        onClick={() => Signal.cycle<DebugView>(p.debugView, VIEW_MODES)}
      />
      {v.debugView === 'UI.Browser' && (
        <Dev.Button
          block
          label={() => `sample files: ${v.sampleFilesMode}`}
          onClick={() => Signal.cycle(p.sampleFilesMode, SAMPLE_FILES_MODES)}
        />
      )}

      <hr />

      <Dev.Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <div className={Styles.title.class}>
        <div>{'Samples'}</div>
        <div>{`dist.json`}</div>
      </div>
      <Dev.Button
        block
        label={() => `👋 hello world`}
        onClick={() => debug.selectDist(SAMPLE.HelloWorld())}
      />
      <Dev.Button block label={() => `(undefined)`} onClick={() => debug.selectDist(undefined)} />

      <hr />
      <Dev.Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Dev.Button block label={() => `(reset)`} onClick={debug.reset} />
      <Dev.ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={0}
        style={{ marginTop: 20 }}
      />
      <Dev.ObjectView name={'Pkg.Dist'} data={Pkg.Dist} expand={0} style={{ marginTop: 5 }} />

      <Dist.UI.Browser debug={v.debug} dist={v.dist} style={{ height: 300, marginTop: 40 }} />
    </div>
  );
};
