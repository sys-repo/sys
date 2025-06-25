import React from 'react';
import { Media } from '../../Media/mod.ts';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Obj, Signal } from '../common.ts';

type P = t.MediaVideoStreamProps;
type L = {
  filters: Partial<t.MediaFilterValues>;
  zoom: Partial<t.MediaZoomValues>;
  muted: P['muted'];
};

const { Filters, Zoom } = Media.Config;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const initial: L = {
    filters: Filters.values(Obj.keys(Filters.config)),
    zoom: Zoom.values(Obj.keys(Zoom.config)),
    muted: D.muted,
  } as const;

  const localstore = LocalStorage.immutable<L>(`dev:${D.name}`, initial);
  const snap = localstore.current;

  const s = Signal.create;
  const props = {
    debug: s(false),
    selectedCamera: s<MediaDeviceInfo>(),
    configFilters: s(snap.filters),
    configZoom: s(snap.zoom),

    theme: s<P['theme']>('Dark'),
    filter: s<P['filter']>(Filters.toString(snap.filters)),
    zoom: s<P['zoom']>(snap.zoom),
    muted: s(snap.muted),
    borderRadius: s<P['borderRadius']>(),
    aspectRatio: s<P['aspectRatio']>(),

    stream: s<P['stream']>(),
  };
  const api = {
    props,
    localstore,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
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

      <Media.Devices.UI.List
        filter={(e) => e.kind === 'videoinput'}
        selected={p.selectedCamera.value}
        onSelect={(e) => (p.selectedCamera.value = e.info)}
      />
      <Media.Config.Filters.UI.List
        style={{ margin: 20 }}
        values={p.configFilters.value}
        onChange={(e) => (p.configFilters.value = e.values)}
        onChanged={(e) => {
          console.info('⚡️ Filters.onChanged:', e);
          p.filter.value = e.filter;
          debug.localstore.change((d) => (d.filters = e.values));
        }}
      />

      <hr />
      <Media.Config.Zoom.UI.List
        style={{ margin: 20 }}
        values={p.configZoom.value}
        onChange={(e) => (p.configZoom.value = e.values)}
        onChanged={(e) => {
          console.info('⚡️ Zoom.onChanged:', e);
          debug.localstore.change((d) => (d.zoom = e.values));
          p.zoom.value = e.values;
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
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `stream (raw): ${p.stream.value?.id}`}
        onClick={async () => {
          const stream = await navigator.mediaDevices.getUserMedia(D.constraints);
          console.log('stream', stream);
          p.stream.value = stream;
        }}
      />

      <hr />
      <Button
        block
        label={() => {
          const v = p.borderRadius.value;
          return `borderRadius: ${v ?? `<undefined> (default: ${D.borderRadius})`}`;
        }}
        onClick={() => Signal.cycle(p.borderRadius, [undefined, 5, 10, 30])}
      />
      <Button
        block
        label={() => {
          const v = p.aspectRatio.value;
          return `aspectRatio: ${v ?? `<undefined>`}`;
        }}
        onClick={() => Signal.cycle(p.aspectRatio, [undefined, '16/9', '16/10', '21/9'])}
      />

      <Button
        block
        label={() => `muted: ${p.muted.value}`}
        onClick={() => Signal.toggle(p.muted)}
      />

      <hr />
      {filterSampleButtons(p.filter)}

      <hr />
      <ObjectView name={'debug'} data={Signal.toObject(debug.props)} expand={0} />
    </div>
  );
};

/**
 * Dev Helpers:
 */
export function filterSampleButtons(signal: t.Signal<P['filter']>) {
  const btn = (label: string, filter?: string) => {
    return (
      <Button
        key={`${label}.${filter}`}
        block
        label={() => label}
        onClick={() => (signal.value = filter)}
        style={{ marginLeft: 20 }}
      />
    );
  };
  return (
    <React.Fragment>
      <div className={Styles.title.class}>{'Filter Samples'}</div>
      {btn('none - <undefined>', undefined)}
      {Object.entries(FILTER_SAMPLES).map(([key, value]) => btn(key, value))}
    </React.Fragment>
  );
}

export const FILTER_SAMPLES = {
  /** “Blown-out spotlight” (extreme) */
  blowOut: 'brightness(180%) contrast(130%) saturate(70%)',

  /** High-key over-exposure (strong but still usable for faces) */
  highKey: 'brightness(160%) contrast(120%) saturate(80%)',

  /** Neutral daylight pop (balanced, vivid) */
  vividPop: 'brightness(115%) contrast(110%) saturate(150%)',

  /** Soft pastel wash (desaturated, low contrast) */
  pastelSoft: 'brightness(110%) contrast(90%) saturate(70%)',

  /** Classic noir (monochrome with punchy tones) */
  noir: 'grayscale(100%) contrast(125%) brightness(110%)',

  /** Vintage sepia */
  sepia: 'sepia(85%) contrast(100%) brightness(105%)',

  /** Warm sunset tint */
  warmTint: 'hue-rotate(-20deg) saturate(120%) brightness(110%)',

  /** Cool arctic tint */
  coolTint: 'hue-rotate(190deg) saturate(120%) brightness(110%)',

  /** Muted documentary (flat, slightly desat) */
  muted: 'saturate(60%) contrast(95%) brightness(105%)',

  /** Dreamy blur-soft focus */
  dreamyBlur: 'blur(4px) brightness(120%) contrast(105%)',
};
