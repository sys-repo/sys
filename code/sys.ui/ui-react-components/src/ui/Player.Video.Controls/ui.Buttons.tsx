import React from 'react';
import { type t, Button, Color, css, D } from './common.ts';
import { Icons } from './Icons.ts';

/**
 * Component: Generic Button.
 */
export type ControlButtonProps = {
  children?: JSX.Element;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: t.ButtonProps['onClick'];
  onMouseDown?: t.ButtonProps['onMouseDown'];
};

export const ControlButton: React.FC<ControlButtonProps> = (props) => {
  const {} = props;
  const [isOver, setOver] = React.useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Size: 32,
      backgroundColor: Color.alpha(Color.LIGHT_BLUE, isOver ? 1 : 0),
      transition: `background-color 200ms`,
      color: theme.fg,
      borderRadius: 4,
      display: 'grid',
    }),
    body: css({ display: 'grid', placeItems: 'center' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        style={styles.body}
        onMouse={(e) => setOver(e.isOver)}
        onClick={props.onClick}
        onMouseDown={props.onMouseDown}
      >
        {props.children}
      </Button>
    </div>
  );
};

/**
 * Component: Play/Pause button.
 */
export type PlayButtonProps = Omit<ControlButtonProps, 'children'> & { playing?: boolean };
export const PlayButton: React.FC<PlayButtonProps> = (props) => {
  const { playing = D.playing } = props;
  const marginRight = playing ? 0 : -1;
  const marginBottom = -2;
  const Icon = playing ? Icons.Pause : Icons.Play;
  return (
    <ControlButton {...props}>
      <Icon color={Color.WHITE} size={16} style={{ marginRight, marginBottom }} />
    </ControlButton>
  );
};

/**
 * Component: Mute button.
 */
export type MuteButtonProps = Omit<ControlButtonProps, 'children'> & { muted?: boolean };
export const MuteButton: React.FC<MuteButtonProps> = (props) => {
  const { muted = D.muted } = props;
  const marginLeft = muted ? 0 : -9;
  const marginBottom = -3;
  const Icon = muted ? Icons.Mute.On : Icons.Mute.Off;
  return (
    <ControlButton {...props}>
      <Icon color={Color.WHITE} size={20} style={{ marginLeft, marginBottom }} />
    </ControlButton>
  );
};
