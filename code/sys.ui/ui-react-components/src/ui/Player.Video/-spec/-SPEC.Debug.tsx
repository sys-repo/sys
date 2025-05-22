import React from 'react';
import { Player } from '../../../mod.ts';
import { type t, Button, css, LocalStorage, Signal, Str } from '../../u.ts';
import { D } from '../common.ts';

type P = t.VideoPlayerProps;
type Storage = { src?: string };

/**
 * Types:
 */
export type DebugProps = {
  debug: DebugSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const localstore = LocalStorage.immutable<Storage>(`dev:${D.name}`, {});

  const s = Signal.create;
  const video = Player.Video.signals({
    src: localstore.current.src,
    // loop: true,
    // autoPlay: true,
    // showControls: false,
  });

  Signal.effect(() => {
    const src = video.src;
    localstore.change((d) => (d.src = src));
  });

  const props = {
    theme: s<P['theme']>('Light'),
    debug: s<P['debug']>(true),
  };
  const api = {
    props,
    video,
    listen() {
      props.debug.value;
      props.theme.value;

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
    title: css({
      fontWeight: 'bold',
      marginBottom: 10,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>
        <div>{'Player.Video'}</div>
        <div />
        <CurrentTime video={video} />
      </div>

      <Button
        block
        label={() => `debug: ${d.debug.value}`}
        onClick={() => Signal.toggle(d.debug)}
      />
      <Button
        block
        label={() => `theme: ${d.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(d.theme, ['Light', 'Dark'])}
      />

      <hr />

      <Button block label={`method: jumpTo(12, play)`} onClick={() => video.jumpTo(12)} />
      <Button
        block
        label={`method: jumpTo(12, paused)`}
        onClick={() => video.jumpTo(12, { play: false })}
      />
      <hr />
      <Button block label={`playing: ${p.playing}`} onClick={() => Signal.toggle(p.playing)} />
      <Button block label={`muted: ${p.muted}`} onClick={() => Signal.toggle(p.muted)} />
      <Button block label={`autoplay: ${p.autoPlay}`} onClick={() => Signal.toggle(p.autoPlay)} />
      <Button block label={`loop: ${p.loop}`} onClick={() => Signal.toggle(p.loop)} />
      <Button
        block
        label={`background: ${p.background} ← ${p.background.value ? 'fill' : 'fixed-size'}`}
        onClick={() => Signal.toggle(p.background)}
      />

      <hr />
      <div className={styles.title.class}>{'Appearance:'}</div>

      <Button
        block
        label={`showControls: ${p.showControls}`}
        onClick={() => Signal.toggle(p.showControls)}
      />
      <Button
        block
        label={`showFullscreenButton: ${p.showFullscreenButton}`}
        onClick={() => Signal.toggle(p.showFullscreenButton)}
      />
      <Button
        block
        label={`showVolumeControl: ${p.showVolumeControl}`}
        onClick={() => Signal.toggle(p.showVolumeControl)}
      />
      <Button
        block
        label={`cornerRadius: ${p.cornerRadius}`}
        onClick={() => Signal.cycle(p.cornerRadius, [0, 5, 10, 15])}
      />
      <Button
        block
        label={`aspectRatio: ${p.aspectRatio}`}
        onClick={() => Signal.cycle(p.aspectRatio, [D.aspectRatio, '4/3', '2.39/1', '1/1'])}
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
          Signal.cycle(p.scale, [undefined, 1, fn, 1.5]);
        }}
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

      <hr />
      <div className={styles.title.class}>{'Video:'}</div>

      {videoButton(video, D.video)}
      {videoButton(video, 'vimeo/727951677')}
      {videoButton(video, 'https://slc-media.orbiter.website/sample/group-scale.webm')}
      {videoButton(video, 'https://slc-media.orbiter.website/sample/group-scale.mp4')}

      <hr />
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
      onClick={() => {
        p.src.value = src;
      }}
    />
  );
}

function CurrentTime(props: { video: t.VideoPlayerSignals; prefix?: string }) {
  const { video, prefix = 'elapsed' } = props;
  const p = video.props;
  Signal.useRedrawEffect(() => p.currentTime.value);
  return <div>{`(${prefix}: ${p.currentTime.value.toFixed(2)}s)`}</div>;
}
