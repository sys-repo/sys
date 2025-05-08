import React from 'react';
import { Media } from '../../Media/mod.ts';
import { type t, Button, ObjectView } from '../../u.ts';
import { css, D, Signal } from '../common.ts';
import { MediaRecorder, useMediaRecorder } from '../mod.ts';

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
  const s = Signal.create;
  const props = {
    debug: s(false),
    stream: s<MediaStream>(),
    theme: s<P['theme']>('Light'),
  };
  const p = props;
  const api = {
    props,
    listen() {
      p.debug.value;
      p.theme.value;
      p.stream.value;
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

  const recorder = useMediaRecorder(p.stream.value);
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Effect: download when finished.
   */
  React.useEffect(() => {
    const { status, blob } = recorder;
    if (status === 'stopped' && blob) Media.download(blob);
  }, [recorder.status, recorder.blob]);

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
      <ObjectView name={'props'} data={Signal.toObject(debug.props)} expand={['$']} />

      <hr />
      <MediaRecorder debug={p.debug.value} />
    </div>
  );
};

/**
 * Helpers
 */
export function recorderButtons(recorder: t.UseMediaRecorderHook) {
  const { status, start, pause, resume, stop } = recorder;
  const canStart = status !== 'recording' && status !== 'paused';
  return (
    <React.Fragment>
      <Button block label="start recording" onClick={start} enabled={canStart} />
      <Button block label="pause" onClick={pause} enabled={status === 'recording'} />
      <Button block label="resume" onClick={resume} enabled={status === 'paused'} />
      <Button block label="stop & save" onClick={stop} enabled={status !== 'idle'} />
      <div style={{ marginTop: 8, opacity: 0.7 }}>{`🌳 status: ${status}`}</div>
    </React.Fragment>
  );
}
