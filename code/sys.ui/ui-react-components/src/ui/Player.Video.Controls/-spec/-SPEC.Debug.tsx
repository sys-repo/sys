import React from 'react';
import { Player } from '../../Player/mod.ts';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Signal } from '../common.ts';

type P = t.PlayerControlsProps;
type Storage = Pick<P, 'theme' | 'debug' | 'maskOpacity' | 'maskHeight' | 'enabled'>;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const defaults: Storage = {
    theme: 'Dark',
    debug: true,
    enabled: D.enabled,
    maskOpacity: D.maskHeight,
    maskHeight: D.maskHeight,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const video = Player.Video.signals();
  const v = video.props;
  v.currentTime.value = 5;
  v.duration.value = 20;
  v.buffered.value = 15;

  const s = Signal.create;
  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    enabled: s(snap.enabled),
    width: s(500),
    maskHeight: s(snap.maskHeight),
    maskOpacity: s(snap.maskOpacity),
  };
  const p = props;
  const api = {
    props,
    video,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => (s as t.Signal).value);

      Object.values(video.props)
        .filter(Signal.Is.signal)
        .forEach((s) => (s as t.Signal).value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.enabled = p.enabled.value;
      d.maskHeight = p.maskHeight.value;
      d.maskOpacity = p.maskOpacity.value;
    });
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
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `maskOpacity: ${p.maskOpacity.value}`}
        onClick={() => Signal.cycle(p.maskOpacity, [0, 0.6, 1])}
      />
      <Button
        block
        label={() => `enabled: ${p.enabled.value}`}
        onClick={() => Signal.toggle(p.enabled)}
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
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
