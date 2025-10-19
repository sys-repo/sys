import { Media } from '@sys/ui-react-components';
import { RecorderHookView } from '@sys/ui-react-components/media/recorder/dev';

import React from 'react';
import { type t, Color, css } from '../common.ts';

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

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ backgroundColor: Color.ruby(debug), color: theme.fg, display: 'grid' }),
    title: css({
      Padding: [5, 8],
      backgroundColor: Color.alpha(theme.fg, 0.06),
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.2)}`,
      fontSize: 13,
      lineHeight: 1.2,
      marginBottom: 5,
    }),
    recorder: css({
      MarginX: 20,
      MarginY: [10, 15],
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{title}</div>
      <RecorderHookView theme={theme.name} recorder={recorder} style={styles.recorder} />
    </div>
  );
};
