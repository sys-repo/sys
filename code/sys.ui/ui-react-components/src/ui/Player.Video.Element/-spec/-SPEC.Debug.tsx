import React from 'react';
import { Player } from '../../Player/mod.ts';
import { type t, Button, css, LocalStorage, ObjectView, Signal, Str } from '../../u.ts';
import { D } from '../common.ts';

type P = t.VideoElementProps;
type Storage = { src?: string; autoPlay?: boolean; muted?: boolean; loop?: boolean };

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const localstore = LocalStorage.immutable<Storage>(`dev:${D.name}`, {});

  const s = Signal.create;
  const video = Player.Video.signals({
    src: localstore.current.src ?? '/sample/group-scale.webm',
    autoPlay: localstore.current.autoPlay,
    muted: localstore.current.muted,
    loop: localstore.current.loop,
  });

  Signal.effect(() => {
    const p = video.props;
    const src = p.src.value;
    const autoPlay = p.autoPlay.value;
    const muted = p.muted.value;
    const loop = p.loop.value;
    localstore.change((d) => {
      d.src = src;
      d.autoPlay = autoPlay;
      d.muted = muted;
      d.loop = loop;
    });
  });

  const props = {
    debug: s(true),
    render: s(true),
    width: s(500),
    theme: s<t.CommonTheme>('Light'),
  };
  const api = {
    props,
    video,
    listen() {
      props.debug.value;
      props.render.value;
      props.theme.value;
      props.width.value;

      /**
       * Video Player:
       */
      const p = video.props;
      p.ready.value;

      // Media:
      p.src.value;
      p.playing.value;
      p.muted.value;
      p.autoPlay.value;
      p.loop.value;

      // Progress:
      p.duration.value;
      p.currentTime.value;

      // Appearance:
      p.showControls.value;
      p.showFullscreenButton.value;
      p.showVolumeControl.value;
      p.background.value;
      p.cornerRadius.value;
      p.aspectRatio.value;
      p.scale.value;
      p.fadeMask.value;

      // Commands:
      p.jumpTo.value;
    },
  };
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
  const video = debug.video;
  const d = debug.props;
  const p = video.props;
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
        <CurrentTime video={video} />
      </div>

      <Button
        block
        label={() => `theme: ${d.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(d.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => {
          const v = p.aspectRatio.value;
          return `aspectRatio: ${v ?? `<undefined> (default: ${D.aspectRatio})`}`;
        }}
        onClick={() => Signal.cycle(p.aspectRatio, [undefined, '21/9', '4/3'])}
      />

      <Button
        block
        label={() => {
          const v = p.cornerRadius.value;
          return `cornerRadius: ${v ?? `<undefined> (default: ${D.cornerRadius})`}`;
        }}
        onClick={() => Signal.cycle(p.cornerRadius, [D.cornerRadius, 5, 20, undefined])}
      />

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
          return `scale: ${typeof current === 'function' ? 'ƒn' : current}`;
        }}
        onClick={() => {
          const fn: t.VideoPlayerScale = (e) => {
            const pixels = 1;
            const res = e.enlargeBy(pixels);
            console.info(`⚡️ scale (callback):`, e);
            console.info(`   increment (${pixels}px):`, res);
            return res;
          };
          Signal.cycle(p.scale, [undefined, D.scale, 1.5, fn]);
        }}
      />

      <hr />
      <div className={Styles.title.class}>{'Video:'}</div>
      {/* {videoButton(video, 'vimeo/727951677')} */}
      {videoButton(video, './sample/group-scale.webm')}
      {videoButton(video, './sample/group-scale.mp4')}
      {videoButton(video, 'https://fs.socialleancanvas.com/video/540p/1068502644.mp4')}
      {videoButton(video, 'https://fs.socialleancanvas.com/video/540p/1068653222.mp4')}

      <hr />
      <div className={Styles.title.class}>{'Controls:'}</div>
      <Button block label={`playing: ${p.playing}`} onClick={() => Signal.toggle(p.playing)} />
      <Button block label={`muted: ${p.muted}`} onClick={() => Signal.toggle(p.muted)} />
      <Button block label={`autoplay: ${p.autoPlay}`} onClick={() => Signal.toggle(p.autoPlay)} />
      <Button block label={`loop: ${p.loop}`} onClick={() => Signal.toggle(p.loop)} />
      <Button
        block
        label={`showControls: ${p.showControls}`}
        onClick={() => Signal.toggle(p.showControls)}
      />

      <hr />
      <Button block label={`method: jumpTo(12, play)`} onClick={() => video.jumpTo(12)} />
      <Button
        block
        label={`method: jumpTo(12, paused)`}
        onClick={() => video.jumpTo(12, { play: false })}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${d.debug.value}`}
        onClick={() => Signal.toggle(d.debug)}
      />
      <Button
        block
        label={() => `render: ${d.render.value}`}
        onClick={() => Signal.toggle(d.render)}
      />
      <Button
        block
        label={() => `width: ${d.width.value}`}
        onClick={() => Signal.cycle(d.width, [420, 500, 600])}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject({ 'video(signals)': p })}
        expand={1}
        style={{ marginTop: 10 }}
      />
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

export function videoButton(video: t.VideoPlayerSignals, src: string) {
  const p = video.props;
  return (
    <Button
      block
      label={`src: ${Str.truncate(wrangle.srcLabel(src), 30)}`}
      onClick={() => (p.src.value = src)}
    />
  );
}

function CurrentTime(props: { video: t.VideoPlayerSignals; prefix?: string }) {
  const { video, prefix = '' } = props;
  const p = video.props;
  const elapsed = p.currentTime.value.toFixed(0);
  const duration = p.duration.value.toFixed();

  Signal.useRedrawEffect(() => {
    p.currentTime.value;
    p.duration.value;
    p.ready.value;
  });

  if (!p.ready.value) return null;
  return <div>{`${prefix} ${elapsed}s / ${duration}s`}</div>;
}
