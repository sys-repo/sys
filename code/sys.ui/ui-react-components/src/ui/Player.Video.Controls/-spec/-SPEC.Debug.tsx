import React from 'react';
import { Player } from '../../Player/mod.ts';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Signal } from '../common.ts';

type P = t.PlayerControlsProps;
type Storage = { theme?: t.CommonTheme };

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

  const video = Player.Video.signals({});
  const v = video.props;
  v.currentTime.value = 0;
  v.duration.value = 20;

  const s = Signal.create;
  const props = {
    debug: s(false),
    theme: s<t.CommonTheme>(localstore.current.theme ?? 'Light'),
    width: s(500),
    maskHeight: s<P['maskHeight']>(D.maskHeight),
    maskOpacity: s<P['maskOpacity']>(D.maskOpacity),
    buffering: s<P['buffering']>(D.buffering),
  };
  const api = {
    props,
    video,
    listen() {
      const p = props;
      p.debug.value;
      p.theme.value;
      p.width.value;
      p.maskHeight.value;
      p.maskOpacity.value;
      p.buffering.value;

      const v = video.props;
      v.playing.value;
      v.muted.value;
      v.currentTime.value;
      v.duration.value;
    },
  };

  Signal.effect(() => {
    const p = props;
    const theme = p.theme.value;
    localstore.change((d) => (d.theme = theme));
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
        label={() => `buffering: ${p.buffering.value}`}
        onClick={() => Signal.toggle(p.buffering)}
      />

      <hr />
      <div className={Styles.title.class}>{'Controls'}</div>
      <Button block label={`playing: ${v.playing}`} onClick={() => Signal.toggle(v.playing)} />
      <Button block label={`muted: ${v.muted}`} onClick={() => Signal.toggle(v.muted)} />
      <hr />
      <Button block label={() => `currentTime: → 10s`} onClick={() => (v.currentTime.value = 10)} />

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
