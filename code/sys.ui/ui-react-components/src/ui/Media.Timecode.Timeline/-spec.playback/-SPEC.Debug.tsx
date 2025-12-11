import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import {
  type t,
  Time,
  Timecode,
  Color,
  css,
  D,
  LocalStorage,
  Obj,
  Signal,
  Player,
} from '../common.ts';
import { loadPlaybackFromEndpoint } from './-u.loader.ts';
import { resolve } from 'node:path';

type P = t.MediaTimecodePlaybackProps;
type Storage = Pick<P, 'debug' | 'theme'>;
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
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

  const video = Player.Video.signals();

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    bundle: s<t.MediaTimeline.PlaybackBundle>(),
  };
  const p = props;
  const api = {
    props,
    video,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(props, true);
    Signal.listen(video.props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
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
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `ƒ loadPlaybackFromEndpoint()`}
        onClick={async () => {
          /**
           * SAMPLE 🐷
           */
          const docid = '2esGLgD5SoQkeucytmGeadm9cC7y';
          const url = 'http://localhost:4040/publish.assets';
          const bundle = await loadPlaybackFromEndpoint(url, docid);

          const { spec, resolveMedia } = bundle;

          console.log('docid', `crdt:${docid}`);
          console.log('bundle', bundle);
          console.log('bundle.spec', bundle.spec);
          console.log('bundle.resolveMedia', bundle.resolveMedia);
          p.bundle.value = bundle;

          const TMP_URL = `http://localhost:4040/publish.assets/video/sha256-e9d0c5e3e47eb2ce908798c957ca4d385daefd3ecb8d68d35135910284f68685.webm`;
          debug.video.props.src.value = TMP_URL;

          // 1. Resolve composite → segments + total + diagnostics.
          const resolved = Timecode.Composite.toVirtualTimeline(spec.composition);

          // 2. Project beats onto the virtual timeline (adds vTime, duration).
          const timeline = Timecode.Experience.toTimeline(resolved, spec.beats);

          console.log('resolved', resolved);
          console.log('timeline', timeline);

          const dur = (ms: t.Msecs = 0) => String(Time.Duration.create(ms));
          const total = {
            duration: dur(timeline.duration),
            beats: timeline.beats.length,
          };
          console.info();
          console.info(` Total Duration ${total.duration} across ${total.beats} beats`);

          const rows = timeline.beats.map((beat, index) => {
            const logicalPath = beat.src.ref;
            const url = resolveMedia({ kind: 'video', logicalPath });
            return {
              'vTime (ms)': beat.vTime,
              'vTime (elapsed)': dur(beat.vTime),
              pause: dur(beat.pause),
              logicalPath,
              url,
              payload: beat.payload,
            };
          });

          console.table(rows);
        }}
      />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView
        name={'video.signals'}
        data={Obj.truncateStrings(Signal.toObject(debug.video.props))}
        style={{ marginTop: 5 }}
        expand={1}
      />
      <ObjectView
        name={'playback-bundle'}
        data={Signal.toObject(p.bundle)}
        style={{ marginTop: 5 }}
        expand={0}
      />
    </div>
  );
};
