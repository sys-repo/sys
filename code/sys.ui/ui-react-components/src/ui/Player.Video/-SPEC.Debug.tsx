import React from 'react';
import { Player } from '../../mod.ts';
import { Button } from '../Button/mod.ts';
import { type t, css, D, Signal } from './common.ts';

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
  const s = Signal.create;

  const video = Player.Video.signals({
    loop: true,
    // autoPlay: true,
    // showControls: false,
  });

  const props = {};
  const api = {
    props,
    video,
    listen() {
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
  const p = video.props;

  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
    title: css({ fontWeight: 'bold', marginBottom: 10 }),
    cols: css({ display: 'grid', gridTemplateColumns: 'auto 1fr auto' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={css(styles.title, styles.cols).class}>
        <div>{'Player.Video'}</div>
        <div />
        <CurrentTime video={video} />
      </div>

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
            const inc = 1;
            const res = e.calc(inc);
            console.info(`⚡️ scale (callback):`, e);
            console.info(`   increment (${inc}px):`, res);
            return res;
          };
          Signal.cycle(p.scale, [undefined, 1, fn, 2]);
        }}
      />

      <hr />

      <Button
        block
        label={`src: ${p.src}`}
        onClick={() =>
          Signal.cycle(p.src, [
            D.video, //           Default:  "tubes"
            'vimeo/727951677', // Rowan:    "group scale"
          ])
        }
      />

      <hr />
    </div>
  );
};

function CurrentTime(props: { video: t.VideoPlayerSignals; prefix?: string }) {
  const { video, prefix = 'elapsed' } = props;
  const p = video.props;
  Signal.useRedrawEffect(() => p.currentTime.value);
  return <div>{`(${prefix}: ${p.currentTime.value.toFixed(2)}s)`}</div>;
}
