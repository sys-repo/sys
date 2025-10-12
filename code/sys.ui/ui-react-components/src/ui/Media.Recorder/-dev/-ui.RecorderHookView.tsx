import React from 'react';
import { Media } from '../../Media/mod.ts';
import { Button, pkg, Str } from '../../u.ts';
import { type t, Color, css, JsrUrl } from '../common.ts';
import { Icons } from '../ui.Icons.ts';
import { ExternalLink } from './-ui.ExternalLink.tsx';

export type RecorderHookViewProps = {
  readonly recorder?: t.MediaRecorderHook;
  readonly debug?: boolean;
  readonly theme?: t.CommonTheme;
  readonly style?: t.CssInput;
};

/**
 * Renders controls and status for a MediaRecorder hook.
 */
export const RecorderHookView: React.FC<RecorderHookViewProps> = (props) => {
  const { debug = false, recorder } = props;

  if (!recorder) return <div>{'`recorder` prop not specified'}</div>;
  const { status, is } = recorder;
  const canStart = !is.recording && status !== 'Paused';
  const urlUseMediaRecorder = JsrUrl.Pkg.file(pkg, 'src/ui/Media.Recorder/use.Recorder.ts');

  /**
   * Render:
   */
  let BulletIcon = Icons.Face;
  if (status === 'Recording') BulletIcon = Icons.Recording;
  if (status === 'Paused') BulletIcon = Icons.Paused;

  const theme = Color.theme(props.theme);
  const dim = Color.alpha(theme.fg, 0.3);
  let statusColor = theme.fg;
  if (is.recording) statusColor = Color.DARK;
  if (is.paused || is.idle || is.stopped) statusColor = dim;

  const strBytes = recorder.bytes > 0 ? ` (${Str.bytes(recorder.bytes)})` : '';

  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gap: 6,
    }),
    row: css({
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
    }),
    title: css({ fontWeight: 'bold' }),
    icon: css({
      opacity: is.recording || is.paused ? 1 : 0,
      color: is.recording ? Color.RED : theme.fg,
    }),
    body: css({ marginLeft: 14, display: 'grid', gap: 6 }),
    actionsRow: css({ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6 }),
  };

  const elStatus = <span style={{ color: statusColor, marginLeft: 5 }}>{status}</span>;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.row.class}>
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

      <div className={styles.body.class}>
        {!is.started && (
          <Button block label={'start recording'} onClick={recorder.start} enabled={canStart} />
        )}
        {is.recording && <Button block label={'pause'} onClick={recorder.pause} />}
        {is.paused && <Button block label={'resume'} onClick={recorder.resume} />}

        <div className={styles.actionsRow.class}>
          <Button
            block
            label={`stop & save ${strBytes}`}
            enabled={is.started}
            onClick={async () => {
              const res = await recorder.stop();
              console.info('⚡️ stopped', res);
              Media.download(res.blob);
            }}
          />
          <Button block label={is.started ? 'cancel' : 'reset'} onClick={recorder.reset} />
        </div>
      </div>
    </div>
  );
};
