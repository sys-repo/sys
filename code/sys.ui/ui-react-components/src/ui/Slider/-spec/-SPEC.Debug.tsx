import React from 'react';
import { Button, ObjectView } from '../../u.ts';
import { type t, Color, css, D, Signal } from '../common.ts';
import { Wrangle } from '../u.ts';

type P = t.SliderProps;

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
  const props = {
    debug: s(false),
    theme: s<P['theme']>('Light'),
    enabled: s<P['enabled']>(D.enabled),
    percent: s<P['percent']>(),
    thumb: s<P['thumb']>(),
    track: s<P['track']>(),
    ticks: s<P['ticks']>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.enabled.value;
      p.percent.value;
      p.thumb.value;
      p.track.value;
      p.ticks.value;
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
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => `enabled: ${p.enabled.value ?? `<undefined> (default: ${D.enabled})`}`}
        onClick={() => Signal.toggle(p.enabled)}
      />

      <hr />
      {configSampleButtons(debug)}

      <hr />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={['$']} />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export function configSampleButtons(debug: DebugSignals) {
  type Fn = (e: Args) => void;
  type Args = {
    thumb: t.SliderThumbProps;
    track: t.SliderTrackProps;
    tracks: t.SliderTrackProps[];
    ticks: t.SliderTickProps;
  };

  const p = debug.props;
  const elButtons: JSX.Element[] = [];
  const theme = Color.theme(p.theme.value);

  const hr = () => elButtons.push(<hr key={elButtons.length} />);
  const push = (label: string, fn?: Fn) => elButtons.push(btn(label, fn));
  const btn = (label: string, fn?: Fn) => {
    return (
      <Button
        block
        key={elButtons.length}
        label={label}
        onClick={() => {
          const partial = {
            thumb: p.thumb.value ?? (p.thumb.value = D.thumb(theme)),
            track: p.track.value ?? (p.track.value = D.track(theme)),
            ticks: p.ticks.value ?? (p.ticks.value = D.ticks(theme)),
          };

          const thumb = Wrangle.thumb(theme, partial.thumb);
          const tracks = Wrangle.tracks(theme, partial.track);
          const track = tracks[0];
          const ticks = Wrangle.ticks(theme, partial.ticks);

          fn?.({ tracks, track, thumb, ticks });
          p.thumb.value = thumb;
          p.track.value = tracks;
          p.ticks.value = ticks;
        }}
      />
    );
  };

  push('(reset)', (e) => {
    const track = D.track(theme);
    const ticks = D.ticks(theme);
    const thumb = D.thumb(theme);

    e.track.height = track.height;
    e.track.percent = track.percent;
    e.ticks.items = ticks.items;
    e.thumb.size = thumb.size;
    e.thumb.opacity = thumb.opacity;
  });

  hr();
  push('skinny track', (e) => {
    e.track.height = 5;
    e.thumb.size = 15;
  });
  push('smaller thumb than track', (e) => {
    e.track.height = 20;
    e.thumb.size = 10;
  });
  hr();

  push('blue', (e) => (e.track.color.highlight = Color.BLUE));
  push('green', (e) => (e.track.color.highlight = Color.GREEN));

  hr();
  push('ticks', (e) => {
    const style = css({ backgroundColor: Color.ruby(), Absolute: [0, -5, 0, -5] });
    e.ticks.items = [
      0.25,
      { value: 0.5, label: 'Midway' },
      { value: 0.75, el: <div className={style.class} /> },
      undefined,
      false,
    ];
  });

  hr();
  push('hidden thumb', (e) => (e.thumb.opacity = 0));
  push('visible thumb', (e) => (e.thumb.opacity = 1));

  hr();
  push('progress track overshoots thumb', (e) => (e.track.percent = 0.5));
  push('multiple tracks (eg. "buffered")', (e) => {
    const theme = Color.theme(p.theme.value);
    const buffer = D.track(theme);
    buffer.color.highlight = Color.alpha(theme.fg, 0.15);
    buffer.percent = 0.75;
    e.tracks.unshift(buffer);
  });

  return (
    <React.Fragment>
      <div className={Styles.title.class}>{'Configuration Samples'}</div>
      {elButtons}
    </React.Fragment>
  );
}
