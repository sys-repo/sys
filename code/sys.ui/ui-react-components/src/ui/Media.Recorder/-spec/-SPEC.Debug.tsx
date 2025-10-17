import React from 'react';
import { RecorderHookView } from '../-dev/mod.ts';
import { Media } from '../../Media/mod.ts';
import { type t, Button, Obj, ObjectView } from '../../u.ts';
import { Color, css, D, LocalStorage, Signal } from '../common.ts';
import { Icons } from '../ui.Icons.ts';

type P = t.MediaRecorderFilesProps;
type L = { filters: Partial<t.MediaFilterValues>; zoom: Partial<t.MediaZoomValues> };
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
    filters: Filters.values(['brightness', 'contrast', 'saturate', 'grayscale']),
    zoom: Zoom.values(Obj.keys(Zoom.config)),
  } as const;
  const localstore = LocalStorage.immutable<L>(`dev:${D.name}`, initial);

  type R = {
    status: t.MediaRecorderStatus;
    is: t.MediaRecorderHookFlags;
    bytes: number;
    blob?: Blob;
  };
  const s = Signal.create;

  const props = {
    debug: s(false),
    config: {
      filters: s(localstore.current.filters),
      zoom: s(localstore.current.zoom),
    },

    theme: s<t.CommonTheme>('Dark'),
    stream: s<MediaStream>(),
    recorder: s<R>(),
    filter: s<string>(Filters.toString(localstore.current.filters)),
    zoom: s<Partial<t.MediaZoomValues>>(localstore.current.zoom),
    aspectRatio: s<string | number>('4/3'),
    selectedCamera: s<MediaDeviceInfo>(),
    selectAudio: s<MediaDeviceInfo>(),
  };
  const p = props;
  const api = {
    props,
    localstore,
    listen,
  };

  function listen() {
    Signal.listen(p);
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
  const recorder = Media.Recorder.UI.useRecorder(p.stream.value, {});

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => debug.listen());
  React.useEffect(() => {
    const { status, is, bytes, blob } = recorder;
    p.recorder.value = { status, is, bytes, blob };
  }, [recorder.status, recorder.bytes]);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({}),
    center: css({ display: 'grid', placeItems: 'center' }),
  };

  const center = (el: React.JSX.Element) => <div className={styles.center.class}>{el}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{D.name}</div>
        <div>{`AspectRatio: ${p.aspectRatio.value}`}</div>
      </div>

      <hr />
      <div className={Styles.title.class}>{'Input'}</div>

      <Media.Devices.UI.List
        style={{ MarginX: 20 }}
        filter={(e) => e.kind === 'videoinput'}
        selected={p.selectedCamera.value}
        onSelect={(e) => (p.selectedCamera.value = e.info)}
      />

      <hr />

      <Media.Devices.UI.List
        style={{ MarginX: 20 }}
        filter={(e) => e.kind === 'audioinput'}
        selected={p.selectAudio.value}
        onSelect={(e) => (p.selectAudio.value = e.info)}
      />

      {center(<Icons.Arrow.Down style={{ MarginY: [10, 5] }} />)}

      <div className={Styles.title.class}>{'Filter'}</div>
      <Media.Config.Filters.UI.List
        style={{ MarginX: 20 }}
        values={p.config.filters.value}
        onChange={(e) => (p.config.filters.value = e.values)}
        onChanged={(e) => {
          console.info('⚡️ Filters.onChanged:', e);
          p.filter.value = e.filter;
          debug.localstore.change((d) => (d.filters = e.values));
        }}
      />

      {center(<Icons.Arrow.Down style={{ MarginY: [10, 5] }} />)}

      <div className={Styles.title.class}>{'Zoom'}</div>
      <Media.Config.Zoom.UI.List
        style={{ margin: 20 }}
        values={p.config.zoom.value}
        onChange={(e) => (p.config.zoom.value = e.values)}
        onChanged={(e) => {
          console.info('⚡️ Zoom.onChanged:', e);
          debug.localstore.change((d) => (d.zoom = e.values));
          p.zoom.value = e.values;
        }}
      />

      {center(<Icons.Arrow.Down style={{ MarginY: [15, 5] }} />)}

      <div className={Styles.title.class}>{'Stream'}</div>
      <RecorderHookView style={{ marginLeft: 20 }} recorder={recorder} />
      {center(<Icons.Arrow.Down style={{ MarginY: [20, 10] }} />)}
      <Media.Recorder.UI.Files debug={p.debug.value} />

      <hr />
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<P['theme']>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <ObjectView
        name={'recorder'}
        data={Signal.toObject({ recorder: p.recorder, filter: p.filter.value })}
        expand={[]}
      />
    </div>
  );
};
