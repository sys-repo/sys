import React from 'react';
import { type t, Button, css, D, LocalStorage, Obj, ObjectView, Signal, STORAGE_KEY } from './common.ts';

type P = t.VideoBackgroundProps;
type Storage = Pick<P, 'theme' | 'video' | 'playing' | 'opacity' | 'blur'>;
const defaults: Storage = {
  theme: 'Dark',
  video: D.TUBES.src,
  playing: D.playing,
  opacity: D.opacity,
  blur: D.blur,
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;
  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV, defaults);
  const snap = store.current;
  const props = {
    theme: s(snap.theme),
    video: s(snap.video),
    playing: s(snap.playing),
    opacity: s(snap.opacity),
    blur: s(snap.blur),
  };
  const p = props;

  /**
   * Persist subsequent changes.
   */
  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.video = p.video.value;
      d.playing = p.playing.value;
      d.opacity = p.opacity.value;
      d.blur = p.blur.value;
    });
  });

  const api = {
    props,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(p, true);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
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
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `video: ${p.video.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle(p.video, [D.TUBES.src, `vimeo/${D.TUBES.id}`])}
      />
      <Button
        block
        label={() => `playing: ${p.playing.value ?? '<undefined>'}`}
        onClick={() => Signal.toggle(p.playing)}
      />
      <Button
        block
        label={() => `opacity: ${p.opacity.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle(p.opacity, [0, 0.2, 0.4, 0.7, 1])}
      />
      <Button
        block
        label={() => `blur: ${p.blur.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle(p.blur, [0, 2, 8, 16])}
      />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={['$']} style={{ marginTop: 10 }} />
    </div>
  );
};
