import React from 'react';
import { Player } from '../../Player/mod.ts';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Signal, Str } from '../common.ts';

type P = t.VideoElementProps;
type Storage = Pick<
  P,
  | 'theme'
  | 'debug'
  | 'muted'
  | 'autoPlay'
  | 'src'
  | 'cornerRadius'
  | 'loop'
  | 'aspectRatio'
  | 'fadeMask'
> & { width?: number; controlled?: boolean };

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

const defaults: Storage = {
  theme: 'Dark',
  debug: true,
  width: 420,
  muted: false,
  autoPlay: false,
  loop: false,
  aspectRatio: '16/9',
  cornerRadius: 6,
  src: 'https://fs.socialleancanvas.com/video/540p/1068502644.mp4',
  controlled: false,
  fadeMask: undefined,
};

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const video = Player.Video.signals({
    src: snap.src,
    autoPlay: snap.autoPlay,
    muted: snap.muted,
    loop: snap.loop,
  });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    width: s(snap.width),
    controlled: s(snap.controlled),

    playing: s(false),
    autoPlay: s(snap.autoPlay),

    src: s(snap.src),
    muted: s(snap.muted),
    loop: s(snap.loop),
    cornerRadius: s(snap.cornerRadius),
    aspectRatio: s(snap.aspectRatio),
    fadeMask: s(snap.fadeMask),
    scale: s<P['scale']>(),
  };
  const p = props;
  const api = {
    props,
    video,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);

      const vp = video.props;
      vp?.currentTime.value;
      vp?.duration.value;
      vp?.ready.value;
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.width = p.width.value;
      d.controlled = p.controlled.value;

      d.src = p.src.value;
      d.autoPlay = p.autoPlay.value;
      d.muted = p.muted.value;

      d.loop = p.loop.value;
      d.cornerRadius = p.cornerRadius.value;
      d.aspectRatio = p.aspectRatio.value;
      d.fadeMask = p.fadeMask.value;
    });
  });

  Signal.effect(() => {
    const controlled = p.controlled.value;
    if (controlled) {
      const vp = video.props;
      vp.src.value = p.src.value;
      vp.autoPlay.value = p.autoPlay.value ?? false;
      vp.muted.value = p.muted.value ?? false;
      vp.loop.value = p.loop.value ?? false;
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
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
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
        label={() => {
          const value = p.fadeMask.value;
          return `fadeMask: ${value ? JSON.stringify(value) : '<undefined>'}`;
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
        label={() => {
          const current = p.scale.value;
          return `scale: ${typeof current === 'function' ? 'ƒn' : current ?? '<undefined>'}`;
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
      {videoButton(p.src, 'https://fs.socialleancanvas.com/video/540p/1068502644.mp4')}
      {videoButton(p.src, 'https://fs.socialleancanvas.com/video/540p/1068653222.mp4')}
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
        label={`method: jumpTo( -3, play )`}
        onClick={() => debug.video?.jumpTo(-3, { play: true })}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `width: ${p.width.value}`}
        onClick={() => Signal.cycle(p.width, [320, 420, 420, 600])}
      />
      <Button
        block
        label={() => `(reset)`}
        onClick={() => {
          p.controlled.value = false;
          p.autoPlay.value = false;
          p.fadeMask.value = undefined;
        }}
      />
      <ObjectView
        name={'debug'}
        data={{
          ...Signal.toObject(p),
          src: Str.truncate(p.src.value, 35),
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
const wrangle = {
  srcLabel(input: string) {
    if (!input.startsWith('https:')) return input;

    // Shorten URL:
    const path = new URL(input).pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return `https: → ${filename}`;
  },
} as const;

export function videoButton(signal: t.Signal<string | undefined>, src: string) {
  return (
    <Button
      block
      label={`src: ${Str.truncate(wrangle.srcLabel(src), 30)}`}
      onClick={() => (signal.value = src)}
    />
  );
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
