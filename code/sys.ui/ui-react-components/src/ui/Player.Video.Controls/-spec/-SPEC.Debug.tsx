import React from 'react';
import { Player } from '../../Player/mod.ts';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Obj, Signal } from '../common.ts';

type P = t.PlayerControlsProps;
type Storage = Pick<
  P,
  'theme' | 'debug' | 'maskOpacity' | 'maskHeight' | 'enabled' | 'background'
> & { width?: number; padding?: t.Pixels };
const defaults: Storage = {
  theme: 'Dark',
  enabled: D.enabled,
  maskOpacity: D.maskHeight,
  maskHeight: D.maskHeight,
  background: D.background,
  padding: D.padding,
  debug: true,
  width: 500,
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
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const video = Player.Video.signals();
  const v = video.props;

  const s = Signal.create;
  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    enabled: s(snap.enabled),
    width: s(snap.width),
    maskHeight: s(snap.maskHeight),
    maskOpacity: s(snap.maskOpacity),
    padding: s(snap.padding),
    background: {
      opacity: s((snap.background ?? {}).opacity),
      rounded: s((snap.background ?? {}).rounded),
      blur: s((snap.background ?? {}).blur),
      shadow: s((snap.background ?? {}).shadow),
    },
  };
  const p = props;
  const api = {
    props,
    video,
    listen,
    reset,
  };

  function listen() {
    Signal.listen(p, true);
    Signal.listen(video.props);
  }

  function resetVideo() {
    v.currentTime.value = 5;
    v.duration.value = 20;
    v.buffered.value = 15;
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
    resetVideo();
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.enabled = p.enabled.value;
      d.maskHeight = p.maskHeight.value;
      d.maskOpacity = p.maskOpacity.value;
      d.padding = p.padding.value;
      d.width = p.width.value;

      d.background = d.background ?? {};
      d.background.opacity = p.background.opacity.value;
      d.background.rounded = p.background.rounded.value;
      d.background.blur = p.background.blur.value;
      d.background.shadow = p.background.shadow.value;
    });
  });

  resetVideo();
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
  const v = debug.video.props;
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{'Player.Video: Controls'}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `enabled: ${p.enabled.value}`}
        onClick={() => Signal.toggle(p.enabled)}
      />
      <Button
        block
        label={() => `maskOpacity: ${p.maskOpacity.value}`}
        onClick={() => Signal.cycle(p.maskOpacity, [0, 0.6, 1])}
      />
      <Button
        block
        label={() => {
          return `maskHeight: ${p.maskHeight.value ?? `(undefined) ← default: ${D.maskHeight}`}`;
        }}
        onClick={() => Signal.cycle(p.maskHeight, [120, 200, undefined])}
      />
      <Button
        block
        label={() => `padding: ${p.padding.value ?? `(undefined) ← default: ${D.padding}`}`}
        onClick={() => Signal.cycle(p.padding, [10, 20, 30])}
      />
      <hr />
      <Button
        block
        label={() => `background.rounded: ${p.background.rounded.value}`}
        onClick={() => Signal.cycle(p.background.rounded, [0, 6, 12, 24])}
      />
      <Button
        block
        label={() => `background.opacity: ${p.background.opacity.value}`}
        onClick={() => Signal.cycle(p.background.opacity, [0, 0.1, 0.3, 0.5, 0.8])}
      />
      <Button
        block
        label={() => `background.shadow: ${p.background.shadow.value}`}
        onClick={() => Signal.toggle(p.background.shadow)}
      />

      <hr />
      <div className={Styles.title.class}>{'Controls'}</div>
      <Button block label={`playing: ${v.playing}`} onClick={() => Signal.toggle(v.playing)} />
      <Button block label={`muted: ${v.muted}`} onClick={() => Signal.toggle(v.muted)} />
      <hr />
      <Button block label={() => `currentTime: → 10s`} onClick={() => (v.currentTime.value = 10)} />
      <Button
        block
        label={() => `buffering: ${v.buffering.value}`}
        onClick={() => Signal.toggle(v.buffering)}
      />

      <hr />
      <div className={Styles.title.class}>{'Samples:'}</div>
      <Button block label={() => `(reset)`} onClick={debug.reset} />
      <Button
        block
        label={() => `rounded background`}
        onClick={() => {
          p.maskOpacity.value = 0;
          p.background.rounded.value = defaults.background?.rounded;
          p.background.opacity.value = 0.3;
          p.padding.value = 20;
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
        label={() => `width: ${p.width.value}`}
        onClick={() => Signal.cycle(p.width, [420, 500, 600])}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject(p)}
        expand={['$']}
        style={{ marginTop: 20 }}
      />
    </div>
  );
};
