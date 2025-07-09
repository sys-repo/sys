import React from 'react';
import { type t, Buttons, Color, css, Media } from './common.ts';

type P = t.AvatarProps;

/**
 * Component:
 */
export const BackBody: React.FC<P> = (props) => {
  const { debug = false, stream } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid', gridTemplateRows: '1fr 1fr' }),
    bottom: css({
      position: 'relative',
      backgroundColor: Color.alpha(theme.fg, 0.08),
      backdropFilter: 'blur(3px)',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignContent: 'center',
    }),
    mic: css({ marginLeft: 8, marginRight: 12 }),
  };

  const ButtonIcon = true ? Buttons.Icons.MicOn : Buttons.Icons.MicOff;

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{''}</div>
      <div className={styles.bottom.class}>
        <Media.UI.AudioWaveform
          debug={debug}
          theme={theme.name}
          stream={stream}
          style={{ top: -2 }}
        />
        <ButtonIcon
          theme={theme.name}
          size={18}
          style={styles.mic}
          onClick={(e) => {
          }}
        />
      </div>
    </div>
  );
};
