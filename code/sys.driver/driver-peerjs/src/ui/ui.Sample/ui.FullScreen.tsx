import React from 'react';
import { type t, Buttons, Color, css, Kbd, Media } from './common.ts';

export type FullScreenProps = {
  stream: MediaStream;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClose?: () => void;
};

/**
 * Component:
 */
export const FullScreen: React.FC<FullScreenProps> = (props) => {
  const {} = props;

  /**
   * Hooks:
   */
  React.useEffect(() => {
    const kbd = Kbd.until();
    kbd.on('Escape', (e) => props.onClose?.());
    return kbd.dispose;
  }, []);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      pointerEvents: 'auto', //        ← NB: reset from overlay turning pointer-events off.
      backdropFilter: 'blur(12px)', // ← NB: this should never be seen, fallback for when/if a stream does not adequately render (edge-case, eg disposed).
    }),
    stream: css({ Absolute: 0 }),
  };

  const elCloseButton = (
    <Buttons.Icons.Close
      theme={'Dark'}
      style={{ Absolute: [4, 5, null, null] }}
      onClick={props.onClose}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Media.Video.UI.Stream stream={props.stream} style={styles.stream} muted={true} />
      {elCloseButton}
    </div>
  );
};
