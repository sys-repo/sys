import React from 'react';
import { Player } from '../../Player/mod.ts';
import { type t, Button, css, LocalStorage, ObjectView, Signal, Str } from '../../u.ts';
import { D } from '../common.ts';

type P = t.VideoElementProps;
type Storage = { src?: string };

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
    // loop: true,
    // autoPlay: true,
    // showControls: false,
  });

  Signal.effect(() => {
    localstore.change((d) => (d.src = video.src));
  });

  const props = {
    debug: s(false),
    theme: s<t.CommonTheme>('Light'),
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
        <div>{video.props.aspectRatio.value ?? D.aspectRatio}</div>
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

      <hr />
      <div className={Styles.title.class}>{'Video:'}</div>
      {videoButton(video, 'vimeo/727951677')}
      {videoButton(video, 'https://slc-media.orbiter.website/sample/group-scale.webm')}
      {videoButton(video, 'https://slc-media.orbiter.website/sample/group-scale.mp4')}
      {videoButton(video, '/sample/group-scale.webm')}

      <hr />
      <Button
        block
        label={() => `debug: ${d.debug.value}`}
        onClick={() => Signal.toggle(d.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject({ video: p })}
        expand={0}
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
      onClick={() => {
        p.src.value = src;
      }}
    />
  );
}
