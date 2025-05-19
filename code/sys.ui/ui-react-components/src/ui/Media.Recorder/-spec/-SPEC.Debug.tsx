import React from 'react';
import { Media } from '../../Media/mod.ts';
import { type t, Button, ObjectView, pkg, Str } from '../../u.ts';
import { Color, css, D, JsrUrl, Signal, LocalStorage } from '../common.ts';
import { Icons } from '../ui.Icons.ts';

type P = t.MediaRecorderFilesProps;
const Filters = Media.Config.Filters;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  type L = { filters: Partial<t.MediaFilterValueMap> };
  const filters = Filters.values(['brightness', 'contrast', 'saturate', 'grayscale']);
  const initial = { filters } as const;
  const localstore = LocalStorage.immutable<L>(`dev:${D.name}.filters`, { filters });

  type R = {
    status: t.MediaRecorderStatus;
    is: t.MediaRecorderHookFlags;
    bytes: number;
    blob?: Blob;
  };
  const s = Signal.create;

  const props = {
    debug: s(false),
    filters: s(localstore.current.filters),

    theme: s<P['theme']>('Dark'),
    stream: s<MediaStream>(),
    recorder: s<R>(),
    filter: s<string>(Filters.toString(initial.filters)),
    aspectRatio: s<string | number>('4/3'),
    selectedCamera: s<MediaDeviceInfo>(),
  };
  const p = props;
  const api = {
    props,
    localstore,
    listen() {
      localstore;
      p.debug.value;
      p.theme.value;
      p.stream.value;
      p.recorder.value;
      p.filter.value;
      p.filters.value;
      p.aspectRatio.value;
      p.selectedCamera.value;
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

  const center = (el: JSX.Element) => <div className={styles.center.class}>{el}</div>;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>
        <div>{D.name}</div>
        <div>{`AspectRatio: ${p.aspectRatio.value}`}</div>
      </div>

      <hr />
      <div className={Styles.title.class}>{'Camera'}</div>

      <Media.Devices.UI.List
        style={{ MarginX: 20 }}
        filter={(e) => e.kind === 'videoinput'}
        selected={p.selectedCamera.value}
        onSelect={(e) => (p.selectedCamera.value = e.info)}
      />
      {center(<Icons.Arrow.Down style={{ MarginY: [10, 5] }} />)}

      <div className={Styles.title.class}>{'Filter'}</div>
      <Media.Config.Filters.UI.List
        style={{ MarginX: 20 }}
        values={p.filters.value}
        onChange={(e) => (p.filters.value = e.values)}
        onChanged={(e) => {
          console.info('⚡️ Filters.onChanged:', e);
          p.filter.value = e.filter;
          debug.localstore.change((d) => (d.filters = e.values));
        }}
      />

      {center(<Icons.Arrow.Down style={{ MarginY: [15, 5] }} />)}
      <div className={Styles.title.class}>{'Stream'}</div>
      <div style={{ marginLeft: 20 }}>{recorderButtons(recorder)}</div>
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

/**
 * Helpers
 */
export type ExternalLinkProps = {
  children?: t.ReactNode;
  href?: string;
  style?: t.CssInput;
  theme?: t.CommonTheme;
};
export const ExternalLink: React.FC<ExternalLinkProps> = (props) => {
  const { children, href } = props;
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      textDecoration: 'none',
      ':hover': { textDecoration: 'underline' },
    }),
  };
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={href}
      className={css(styles.base, props.style).class}
    >
      {children}
    </a>
  );
};

export function recorderButtons(recorder: t.MediaRecorderHook) {
  const { status, start, is } = recorder;
  const canStart = !is.recording && status !== 'Paused';
  const theme = Color.theme();

  let BulletIcon = Icons.Face;
  if (status === 'Recording') BulletIcon = Icons.Recording;
  if (status === 'Paused') BulletIcon = Icons.Paused;

  const styles = {
    base: css({ display: 'grid', gridTemplateColumns: `1fr auto`, alignItems: 'center' }),
    title: css({ fontWeight: 'bold' }),
    icon: css({
      opacity: is.recording || is.paused ? 1 : 0,
      color: is.recording ? Color.RED : theme.fg,
    }),
  };

  let statusColor = theme.fg;
  const dim = Color.alpha(theme.fg, 0.3);
  if (is.recording) statusColor = Color.DARK;
  if (is.paused || is.idle || is.stopped) statusColor = dim;

  const elStatus = <span style={{ color: statusColor, marginLeft: 5 }}>{status}</span>;
  const strBytes = recorder.bytes > 0 ? ` (${Str.bytes(recorder.bytes)})` : '';
  const urlUseMediaRecorder = JsrUrl.Pkg.file(pkg, 'src/ui/Media.Recorder/use.Recorder.ts');

  return (
    <React.Fragment>
      <div className={styles.base.class}>
        <div className={styles.title.class}>
          <ExternalLink
            style={{ color: Color.MAGENTA }}
            href={urlUseMediaRecorder}
            children={'ƒ useMediaRecorder:'}
          />
          {elStatus}
        </div>
        <BulletIcon size={18} style={styles.icon} />
      </div>

      <div style={{ marginLeft: 14 }}>
        {!is.started && (
          <Button block label={'start recording'} onClick={start} enabled={canStart} />
        )}
        {is.recording && <Button block label={'pause'} onClick={recorder.pause} />}
        {is.paused && <Button block label={'resume'} onClick={recorder.resume} />}
        <div className={styles.base.class}>
          <Button
            block
            label={`stop & save ${strBytes}`}
            enabled={is.started}
            onClick={async () => {
              const res = await recorder.stop();
              console.log('⚡️ stopped', res);
              Media.download(res.blob);
            }}
          />
          <Button block label={is.started ? 'cancel' : 'reset'} onClick={recorder.reset} />
        </div>
      </div>
    </React.Fragment>
  );
}
