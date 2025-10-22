import { Media } from '@sys/ui-react-components';
import { RecorderHookView } from '@sys/ui-react-components/media/recorder/dev';

import React from 'react';
import { type t, Color, css, Time } from '../common.ts';

export type RecorderControlsProps = {
  title?: string;
  stream?: MediaStream;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
type P = RecorderControlsProps;

/**
 * Component:
 */
export const RecorderControls: React.FC<P> = (props) => {
  const { debug = false, stream, title = 'Recorder' } = props;

  /**
   * Hooks:
   */
  const recorder = Media.Recorder.UI.useRecorder(stream);
  const elapsed = recorder.elapsed;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ backgroundColor: Color.ruby(debug), color: theme.fg, display: 'grid' }),
    title: {
      base: css({
        Padding: [5, 12, 5, 8],
        backgroundColor: Color.alpha(theme.fg, 0.06),
        borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.2)}`,
        fontSize: 13,
        lineHeight: 1.2,
        marginBottom: 5,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
      }),
    },
    recorder: css({
      MarginX: 20,
      MarginY: [10, 15],
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.base.class}>
        <div>{title}</div>
        <div />
        <div>{elapsed ? Time.duration(elapsed).toString() : null}</div>
      </div>
      <RecorderHookView theme={theme.name} recorder={recorder} style={styles.recorder} />
    </div>
  );
};
