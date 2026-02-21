import type { HarnessProps } from '../-dev/-harness/t.ts';

import React from 'react';
import {
  type t,
  Json,
  Button,
  Color,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Player,
  Signal,
  Str,
} from './common.ts';
import { OriginPanel } from './-ui.Origin.tsx';
import { ORIGIN, resolveOriginUrls, type OriginEnv } from './-u.origin.ts';
import { Sample } from './u.loader.ts';
import { LoadTimelinePanel } from './ui.LoadTimelinePanel.tsx';
import { PlayControls } from './ui.PlayControls.tsx';

type P = HarnessProps;
type Storage = Pick<P, 'debug' | 'theme'> & { docid?: t.StringId; env?: OriginEnv };
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  env: ORIGIN.DEFAULT_ENV,
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

  const createSignals = Video.Signals.create;
  const createVideo = () => createSignals({ cornerRadius: 4, showControls: false, muted: true });
  const createDecks = (): t.VideoDecks => ({
    A: createVideo(),
    B: createVideo(),
  });
  const decks = createDecks();

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    docid: s(snap.docid),
    env: s(snap.env),
    bundle: s<t.TimecodePlaybackDriver.Wire.Bundle>(),
    controller: s<t.TimecodePlaybackDriver.TimelineController>(),
    snapshot: s<t.TimecodeState.Playback.Snapshot>(),
  };
  const p = props;
  const api = {
    props,
    decks,
    listen,
    reset,
    get activeDeck() {
      return p.snapshot.value?.state.decks.active;
    },
    get urls() {
      return resolveOriginUrls(p.env.value);
    },
  };

  function listen() {
    Signal.listen(props, true);
    Signal.listen(decks.A.props);
    Signal.listen(decks.B.props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
    Sample.unload(api);
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.docid = p.docid.value;
      d.env = p.env.value;
    });
  });

  if (p.docid.value) {
    Sample.load(api, p.docid.value);
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
      </div>
      <Button
        block
        label={() => `theme: ${v.theme ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <hr />
      <OriginPanel
        theme={theme.name}
        env={v.env}
        style={{ marginBottom: 14 }}
        onChange={(e) => (p.env.value = e.env)}
      />
      <hr />
      <div className={Styles.title.class}>
        <div>{'ƒ loadTimeline( dist.json )'}</div>
        <div>{'(fetch / json)'}</div>
      </div>

      <Button block label={() => `(unload)`} onClick={() => Sample.unload(debug)} />
      <LoadTimelinePanel
        theme={theme.name}
        style={{ marginTop: 10, marginBottom: 20, height: 300 }}
        baseUrl={debug.urls.app}
        selectedDocid={p.docid.value}
        onSelect={(e) => {
          console.info('⚡️ onSelect: LoadTimelinePanel.onSelect', e.docid);
          Sample.load(debug, e.docid);
        }}
      />

      <hr />
      <div className={Styles.title.class}>
        <div>{'ƒ TimelineController.<Cmd>'}</div>
        <div>{'(Player)'}</div>
      </div>
      <Button block label={() => `play`} onClick={() => v.controller?.play()} />
      <Button block label={() => `pause`} onClick={() => v.controller?.pause()} />
      <Button block label={() => `toggle`} onClick={() => v.controller?.toggle()} />
      <PlayControls debug={debug} />
      <Player.Video.Decks.UI
        decks={debug.decks}
        active={debug.activeDeck}
        muted={true}
        gap={20}
        show={'both'}
        style={{ Margin: [10, 40, 15, 40] }}
      />

      <hr />
      <div className={Styles.title.class}>
        <div>{'ƒ VideoDeck.<Cmd>'}</div>
        <div>{'(Signals)'}</div>
      </div>
      <Button block label={() => `deck A: play`} onClick={() => debug.decks.A.play()} />
      <Button block label={() => `deck A: pause`} onClick={() => debug.decks.A.pause()} />
      <Button block label={() => `deck B: play`} onClick={() => debug.decks.B.play()} />
      <Button block label={() => `deck B: pause`} onClick={() => debug.decks.B.pause()} />

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
      <VideoObjectView name={'video-A'} video={debug.decks.A} />
      <VideoObjectView name={'video-B'} video={debug.decks.B} />
      <Button
        style={{ marginTop: 8 }}
        block
        label={() => 'copy debug'}
        onClick={() => {
          const data = {
            'video-A': videoObjectData(debug.decks.A),
            'video-B': videoObjectData(debug.decks.B),
          };
          navigator.clipboard.writeText(Json.stringify(data));
        }}
      />
    </div>
  );
};

/**
 * Helpers:
 */

function VideoObjectView(props: { name?: string; video: t.VideoPlayerSignals }) {
  return (
    <ObjectView
      name={props.name}
      data={videoObjectData(props.video)}
      style={{ marginTop: 5 }}
      expand={0}
    />
  );
}

export function videoObjectData(video: t.VideoPlayerSignals) {
  return {
    instance: video.instance,
    ...Signal.toObject(video.props),
    src: Str.ellipsize(video.props.src.value || '-', [15, 20]),
  };
}
