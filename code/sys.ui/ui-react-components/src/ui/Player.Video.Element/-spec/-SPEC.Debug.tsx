import React from 'react';
import { Player } from '../../Player/mod.ts';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Obj, Signal, Str, Time } from '../common.ts';

type P = t.VideoElementProps;
type Storage = Pick<
  P,
  | 'theme'
  | 'debug'
  | 'muted'
  | 'autoPlay'
  | 'cornerRadius'
  | 'loop'
  | 'aspectRatio'
  | 'fadeMask'
  | 'slice'
  | 'controls'
  | 'interaction'
> & {
  width?: number;
  controlled?: boolean;
  logSignals?: boolean;
  endpointLocalhost?: boolean;
  urlPath?: string;
  urlCopied?: boolean;
  infoPanel?: boolean;
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  width: 600,
  muted: false,
  autoPlay: false,
  loop: false,
  aspectRatio: '16/9',
  cornerRadius: 15,
  urlPath: '/video/540p/1068502644.mp4',
  controlled: false,
  fadeMask: undefined,
  slice: undefined,
  controls: D.controls,
  interaction: D.interaction,

  // Debug:
  logSignals: true,
  endpointLocalhost: false,
  infoPanel: true,
};

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
    width: s(snap.width),
    controlled: s(snap.controlled),
    logSignals: s(snap.logSignals),
    endpointLocalhost: s(snap.endpointLocalhost),
    infoPanel: s(snap.infoPanel),
    controls: {
      background: {
        opacity: s((snap.controls?.background ?? {}).opacity),
        rounded: s((snap.controls?.background ?? {}).rounded),
        blur: s((snap.controls?.background ?? {}).blur),
        shadow: s((snap.controls?.background ?? {}).shadow),
      },

      maskOpacity: s((snap.controls ?? {}).maskOpacity),
      padding: s((snap.controls ?? {}).padding),
      margin: s((snap.controls ?? {}).margin),
    },
    interaction: {
      clickToPlay: s((snap.interaction ?? {}).clickToPlay),
    },

    playing: s(false),
    autoPlay: s(snap.autoPlay),

    urlPath: s(snap.urlPath),
    urlCopied: s(snap.urlCopied),

    muted: s(snap.muted),
    loop: s(snap.loop),
    cornerRadius: s(snap.cornerRadius),
    aspectRatio: s(snap.aspectRatio),
    fadeMask: s(snap.fadeMask),
    slice: s(snap.slice),
    scale: s<P['scale']>(),
  };
  const p = props;
  const api = {
    props,
    listen,
    reset,
    get video() {
      return video;
    },
    get domain() {
      return p.endpointLocalhost.value
        ? 'http://localhost:8080'
        : 'https://fs.socialleancanvas.com';
    },
    get src() {
      const path = (p.urlPath.value || '').replace(/^\/+/, '');
      const url = `${api.domain}/${path}`;
      return url;
    },
  };

  const video = Player.Video.signals({
    src: api.src,
    autoPlay: snap.autoPlay,
    muted: snap.muted,
    loop: snap.loop,
  });

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  function listen() {
    // Only subscribe the debug panel to its own (low-frequency) props.
    // High-frequency video telemetry (currentTime, etc.) is handled by <CurrentTime>.
    Signal.listen(p, true);
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.width = p.width.value;
      d.controlled = p.controlled.value;
      d.logSignals = p.logSignals.value;
      d.endpointLocalhost = p.endpointLocalhost.value;
      d.infoPanel = p.infoPanel.value;

      d.urlPath = p.urlPath.value;
      d.autoPlay = p.autoPlay.value;
      d.muted = p.muted.value;

      d.loop = p.loop.value;
      d.cornerRadius = p.cornerRadius.value;
      d.aspectRatio = p.aspectRatio.value;
      d.fadeMask = p.fadeMask.value;
      d.slice = p.slice.value;

      d.controls = d.controls ?? {};
      d.controls.background = d.controls.background ?? {};
      d.controls.background.opacity = p.controls.background.opacity.value;
      d.controls.background.rounded = p.controls.background.rounded.value;
      d.controls.background.blur = p.controls.background.blur.value;
      d.controls.background.shadow = p.controls.background.shadow.value;
      d.controls.maskOpacity = p.controls.maskOpacity.value;
      d.controls.padding = p.controls.padding.value;
      d.controls.margin = p.controls.margin.value;

      d.interaction = d.interaction ?? {};
      d.interaction.clickToPlay = p.interaction.clickToPlay.value;
    });
  });

  /**
   * Sync: Uncontrolled → Controlled (Signals).
   */
  Signal.effect(() => {
    const controlled = p.controlled.value;
    if (controlled) {
      const vp = video.props;
      vp.src.value = api.src;
      vp.autoPlay.value = p.autoPlay.value ?? false;
      vp.muted.value = p.muted.value ?? false;
      vp.loop.value = p.loop.value ?? false;
      vp.slice.value = p.slice.value;
      vp.fadeMask.value = p.fadeMask.value;
      vp.scale.value = p.scale.value;
      vp.cornerRadius.value = p.cornerRadius.value;
    }
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
  const styles = {
    base: css({}),
    url: css({
      boxSizing: 'border-box',
      fontFamily: 'monospace',
      textAlign: 'center',
      fontSize: 9,
      fontWeight: 600,
      overflowWrap: 'anywhere',
      wordBreak: 'break-all',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{'Player.Video: Element'}</div>
        {p.controlled.value && <CurrentTime video={debug.video} />}
      </div>
      <Button
        block
        label={() => {
          const v = p.controlled.value;
          const note = v ? 'Controlled (Signal State)' : 'Uncontrolled';
          return `controlled: ${v} ← ${note}`;
        }}
        onClick={() => Signal.toggle(p.controlled)}
      />
      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        enabled={() => !p.controlled.value}
        label={() => `muted: ${p.muted.value}`}
        onClick={() => Signal.toggle(p.muted)}
      />
      <Button
        block
        enabled={() => !p.controlled.value}
        label={() => `autoPlay: ${p.autoPlay.value}`}
        onClick={() => Signal.toggle(p.autoPlay)}
      />
      <Button
        block
        enabled={() => !p.controlled.value}
        label={() => `loop: ${p.loop.value}`}
        onClick={() => Signal.toggle(p.loop)}
      />
      <Button
        block
        enabled={() => !p.controlled.value}
        label={() => `cornerRadius: ${p.cornerRadius.value}`}
        onClick={() => Signal.cycle(p.cornerRadius, [0, 6, 15])}
      />
      <hr />
      <Button
        block
        enabled={() => !p.controlled.value}
        label={() => {
          const v = p.slice.value;
          return `slice: ${v ? v : `(undefined)`}`;
        }}
        onClick={() => {
          Signal.cycle(p.slice, [undefined, '00:00:00..00:00:45', '00:00:10..-00:00:20']);
        }}
      />

      <hr />
      <Button
        block
        enabled={() => !p.controlled.value}
        label={() => {
          const value = p.fadeMask.value;
          return `fadeMask: ${value ? JSON.stringify(value) : '(undefined)'}`;
        }}
        onClick={() => {
          type T = t.VideoPlayerFadeMask | undefined;
          Signal.cycle<T>(p.fadeMask, [
            { direction: 'Top:Down' },
            { direction: 'Bottom:Up' },
            { direction: 'Left:Right' },
            { direction: 'Right:Left' },
            undefined,
          ]);
        }}
      />
      <Button
        block
        enabled={() => !p.controlled.value}
        label={() => {
          const current = p.scale.value;
          return `scale: ${typeof current === 'function' ? 'ƒn' : (current ?? '(undefined)')}`;
        }}
        onClick={() => {
          const fn: t.VideoPlayerScale = (e) => {
            const pixels = 3;
            const res = e.enlargeBy(pixels);
            console.info(`⚡️ scale (callback):`, e);
            console.info(`   increment (${pixels}px):`, res);
            return res;
          };
          Signal.cycle(p.scale, [1.5, D.scale, fn]);
        }}
      />

      <hr />
      <div className={Styles.title.class}>{'Video:'}</div>
      {[
        '/video/540p/1068502644.mp4',
        '/video/540p/1068653222.mp4',
        '/video/v2/core/sha256-3ee12096a189525fcbb0e85d1781fc414e46e8c306b6ee170af17fe8bd2b11c7.webm',
      ].map((src) => videoButton(debug, p.urlPath, src))}
      <div className={css(styles.url, { Padding: [15, 15, 8, 15] }).class}>{debug.src}</div>
      <Button
        block
        label={() => (p.urlCopied.value ? 'copied' : `copy url`)}
        onClick={() => {
          navigator.clipboard.writeText(debug.src);
          p.urlCopied.value = true;
          Time.delay(1500, () => (p.urlCopied.value = false));
        }}
      />
      <hr />
      <Button
        block
        enabled={() => !!p.controlled.value}
        label={`method: jumpTo( 0, paused )`}
        onClick={() => debug.video?.jumpTo(0, { play: false })}
      />
      <Button
        block
        enabled={() => !!p.controlled.value}
        label={`method: jumpTo( 12, paused )`}
        onClick={() => debug.video?.jumpTo(12, { play: false })}
      />
      <Button
        block
        enabled={() => !!p.controlled.value}
        label={`method: jumpTo( 12, play )`}
        onClick={() => debug.video?.jumpTo(12)}
      />
      <Button
        block
        enabled={() => !!p.controlled.value}
        label={`method: jumpTo( -2, play )`}
        onClick={() => debug.video?.jumpTo(-2, { play: true })}
      />
      <Button
        block
        enabled={() => !!p.controlled.value}
        label={`method: jumpTo( -2, paused )`}
        onClick={() => debug.video?.jumpTo(-2, { play: false })}
      />

      <hr />
      <Button
        block
        label={() => {
          const v = p.interaction.clickToPlay.value;
          const d = D.interaction.clickToPlay;
          return `interaction.clickToPlay: ${v ?? `(undefined) ← default: ${d}`}`;
        }}
        onClick={() => Signal.toggle(p.interaction.clickToPlay)}
      />

      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <Button
        block
        label={() => `controls → rounded inset`}
        onClick={() => {
          p.controls.maskOpacity.value = 0;
          p.controls.margin.value = 10;
          p.controls.padding.value = [12, 14];
          p.controls.background.rounded.value = 10;
          p.controls.background.opacity.value = 0.3;
        }}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => {
          const v = p.endpointLocalhost.value;
          return `endpoint: ${v ? '(localhost)' : 'public internet (ipfs)'}`;
        }}
        onClick={() => Signal.toggle(p.endpointLocalhost)}
      />
      <Button
        block
        label={() => `show InfoPanel: ${p.infoPanel.value}`}
        onClick={() => Signal.toggle(p.infoPanel)}
      />
      <Button
        block
        enabled={() => !!p.controlled.value}
        label={() => `Video.useSignals: log: ${p.logSignals.value}`}
        onClick={() => Signal.toggle(p.logSignals)}
      />
      <Button
        block
        label={() => `width: ${p.width.value}`}
        onClick={() => Signal.cycle(p.width, [320, 420, 420, 600])}
      />

      <ObjectView
        name={'debug'}
        data={{
          ...Signal.toObject(p),
          src: Str.truncate(debug.src, 35),
        }}
        expand={0}
        style={{ marginTop: 15 }}
      />
      {p.controlled.value && (
        <ObjectView
          name={'signals'}
          data={{
            ...Signal.toObject(debug.video?.props),
            src: Str.truncate(debug.video?.props.src.value, 35),
          }}
          expand={1}
          style={{ marginTop: 5 }}
        />
      )}
    </div>
  );
};

/**
 * Helpers:
 */
export function videoButton(
  debug: DebugSignals,
  signal: t.Signal<string | undefined>,
  path: string,
) {
  let label = `src: ${path.slice(0, 10)} .. ${debug.src.slice(-10)}`;
  label = Str.truncate(label, 30);
  return <Button key={path} block label={label} onClick={() => (signal.value = path)} />;
}

function CurrentTime(props: { video?: t.VideoPlayerSignals; prefix?: string }) {
  const { video, prefix = '' } = props;
  const p = video?.props;
  const elapsed = p?.currentTime.value.toFixed(0);
  const duration = p?.duration.value.toFixed();

  Signal.useRedrawEffect(() => {
    p?.currentTime.value;
    p?.duration.value;
    p?.ready.value;
  });

  if (!p) return null;
  if (!p.ready.value) return null;
  return <div>{`${prefix} ${elapsed}s / ${duration}s`}</div>;
}
