import React from 'react';
import { type t, Button, ObjectView, Str } from '../../u.ts';
import { Color, css, D, Icons, Signal } from '../common.ts';
import { MediaRecorder, useMediaRecorder } from '../mod.ts';
import { Media } from '../../Media/mod.ts';

type P = t.MediaRecorderProps;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  type R = {
    status: t.MediaRecorderStatus;
    is: t.MediaRecorderHookFlags;
    bytes: number;
    blob?: Blob;
  };
  const s = Signal.create;
  const props = {
    debug: s(false),
    theme: s<P['theme']>('Dark'),
    stream: s<MediaStream>(),
    recorder: s<R>(),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.stream.value;
      p.recorder.value;
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
  const recorder = useMediaRecorder(p.stream.value, {});

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
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

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

      <hr />
      {recorderButtons(recorder)}

      <hr />
      <MediaRecorder debug={p.debug.value} />

      <hr />
      <ObjectView name={'recorder'} data={Signal.toObject(debug.props.recorder)} expand={['$']} />
    </div>
  );
};

/**
 * Helpers
 */
export function recorderButtons(recorder: t.MediaRecorderHook) {
  const { status, start, is } = recorder;
  const canStart = !is.recording && status !== 'Paused';
  const theme = Color.theme();

  let BulletIcon = Icons.Face;
  if (status === 'Recording') BulletIcon = Icons.Recorder.Recording;
  if (status === 'Paused') BulletIcon = Icons.Recorder.Paused;

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
  if (is.recording) statusColor = Color.RED;
  if (is.paused || is.idle || is.stopped) statusColor = dim;

  const elStatus = <span style={{ color: statusColor }}>{status}</span>;
  const strBytes = recorder.bytes > 0 ? ` (${Str.bytes(recorder.bytes)})` : '';

  return (
    <React.Fragment>
      <div className={styles.base.class}>
        <div className={styles.title.class}>
          <span>{`useMediaRecorder: `}</span>
          {elStatus}
        </div>
        <BulletIcon size={18} style={styles.icon} />
      </div>

      {!is.started && <Button block label={'start recording'} onClick={start} enabled={canStart} />}
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
    </React.Fragment>
  );
}
