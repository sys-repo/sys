import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Str, Color, css, D, LocalStorage, Obj, Player, Signal } from '../common.ts';
import { Sample } from './-u.loader.ts';

type P = t.MediaTimelineHarnessProps;
type Storage = Pick<P, 'debug' | 'theme'> & { docid?: t.StringId };
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

  const Video = Player.Video;
  const createVideo = () => Video.signals({ cornerRadius: 4, showControls: false, muted: true });
  const video = { A: createVideo(), B: createVideo() };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    docid: s(snap.docid),
    bundle: s<t.SpecTimelineBundle>(),
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
    Signal.listen(video.A.props);
    Signal.listen(video.B.props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
    Sample.unload(api);
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.docid = p.docid.value;
    });
  });

  if (p.docid.value) Sample.load(api, p.docid.value);
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

  const load = (docid: t.StringId, msg: string = '') => {
    const isCurrent = docid === p.docid.value;
    const id = Str.ellipsize(docid, [5, 5], ' .. ');
    const label = `- load → crdt:${id} ${msg} ${isCurrent ? '🌳' : ''}`;
    return (
      <Button
        block
        label={label}
        onClick={() => Sample.load(debug, docid)}
        tooltip={`crdt:${docid}`}
      />
    );
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
        <div>{'ƒ loadTimeline()'}</div>
        <div>{'(fetch / json)'}</div>
      </div>
      {load('2esGLgD5SoQkeucytmGeadm9cC7y')}
      {load('2kcH93dUVmRsZq77YVbaTLNGPr8z')}
      {load('hmNovS1do4wchHwisw3gF1EnrKF', '(issues)')}
      <Button block label={() => `(unload)`} onClick={() => Sample.unload(debug)} />

      <hr />
      <Button block label={() => `debug: ${v.debug}`} onClick={() => Signal.toggle(p.debug)} />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <ObjectView
        name={v.docid ? `playback-bundle( ${v.docid?.slice(-5)} )` : 'playback-bundle'}
        data={Signal.toObject(v.bundle)}
        style={{ marginTop: 5 }}
        expand={0}
      />
      <VideoObjectView name={'video-A'} video={debug.video.A} />
      <VideoObjectView name={'video-B'} video={debug.video.B} />
    </div>
  );
};

function VideoObjectView(props: { name?: string; video: t.VideoPlayerSignals }) {
  const { name, video } = props;
  return (
    <ObjectView
      name={name}
      data={{
        ...Signal.toObject(video.props),
        src: Str.ellipsize(video.props.src.value || '-', [15, 20]),
      }}
      style={{ marginTop: 5 }}
      expand={0}
    />
  );
}
