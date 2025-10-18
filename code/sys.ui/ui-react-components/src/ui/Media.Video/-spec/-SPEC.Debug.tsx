import React from 'react';
import { Media } from '../../Media/mod.ts';
import { Button, ObjectView } from '../../u.ts';
import { type t, css, D, LocalStorage, Obj, Signal } from '../common.ts';
import { FILTER_SAMPLES } from './-u.samples.ts';

const { Filters, Zoom } = Media.Config;

type P = t.MediaVideoStreamProps;
type Storage = Pick<P, 'theme' | 'debug' | 'muted' | 'filter' | 'borderRadius' | 'aspectRatio'> & {
  filters: Partial<t.MediaFilterValues>;
  zoom: Partial<t.MediaZoomValues>;
};
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  filters: Filters.values(Obj.keys(Filters.config)),
  zoom: Zoom.values(Obj.keys(Zoom.config)),
  muted: D.muted,
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

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = { ...defaults, ...store.current };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    muted: s(snap.muted),
    borderRadius: s(snap.borderRadius),
    aspectRatio: s(snap.aspectRatio),
    configFilters: s(snap.filters),
    configZoom: s(snap.zoom),
    filter: s<P['filter']>(Filters.toString(snap.filters)),
    zoom: s<P['zoom']>(snap.zoom),
    selectedCamera: s<MediaDeviceInfo>(),
    stream: s<P['stream']>(),
  };
  const p = props;
  const api = {
    props,
    reset,
    listen,
    store,
  };

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
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
          debug.store.change((d) => (d.filters = e.values));
        }}
      />

      <hr />
      <Media.Config.Zoom.UI.List
        style={{ margin: 20 }}
        values={p.configZoom.value}
        onChange={(e) => (p.configZoom.value = e.values)}
        onChanged={(e) => {
          console.info('⚡️ Zoom.onChanged:', e);
          debug.store.change((d) => (d.zoom = e.values));
          p.zoom.value = e.values;
        }}
      />

      <hr />

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `stream (raw): ${p.stream.value?.id}`}
        onClick={async () => {
          const stream = await navigator.mediaDevices.getUserMedia(D.constraints);
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
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
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
