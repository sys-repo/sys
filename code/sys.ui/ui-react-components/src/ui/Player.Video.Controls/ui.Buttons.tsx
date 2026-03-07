import React from 'react';
import { type t, Button, Color, css, D } from './common.ts';
import { Icons } from './ui.Icons.ts';

/**
 * Component: Generic Button.
 */
export type ControlButtonProps = {
  children?: React.JSX.Element;
  debug?: boolean;
  enabled?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: t.ButtonProps['onClick'];
  onMouseDown?: t.ButtonProps['onMouseDown'];
};

export const ControlButton: React.FC<ControlButtonProps> = (props) => {
  const { enabled = D.enabled } = props;
  const [isOver, setOver] = React.useState(false);
  const active = isOver && enabled;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Size: 32,
      backgroundColor: Color.alpha(Color.LIGHT_BLUE, active ? 1 : 0),
      transition: `background-color 120ms ease`,
      color: theme.fg,
      borderRadius: 4,
      display: 'grid',

      /**
       * Hardening: prevent layout drift from parent typography.
       * (eg. inherited line-height affecting inline children)
       */
      placeItems: 'center',
      lineHeight: 0,
    }),
    body: css({
      display: 'grid',
      placeItems: 'center',

      /**
       * Hardening: fully reset the underlying <button> box.
       * Ensures a deterministic 32x32 clickable square regardless
       * of global button/typography defaults.
       */
      width: '100%',
      height: '100%',
      minWidth: 0,
      minHeight: 0,
      padding: 0,
      margin: 0,
      lineHeight: 0,
      boxSizing: 'border-box',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        style={styles.body}
        enabled={enabled}
        onMouse={(e) => setOver(e.is.over)}
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
  const marginBottom = 0;
  const Icon = playing ? Icons.Pause : Icons.Play;
  return (
    <ControlButton {...props}>
      <Icon color={Color.WHITE} size={16} style={{ marginRight, marginBottom, display: 'block' }} />
    </ControlButton>
  );
};

/**
 * Component: Mute button.
 */
export type MuteButtonProps = Omit<ControlButtonProps, 'children'> & { muted?: boolean };
export const MuteButton: React.FC<MuteButtonProps> = (props) => {
  const { muted = D.muted } = props;
  const marginLeft = muted ? 1 : -8;
  const marginBottom = -2;
  const Icon = muted ? Icons.Mute.On : Icons.Mute.Off;
  return (
    <ControlButton {...props}>
      <Icon color={Color.WHITE} size={20} style={{ marginLeft, marginBottom, display: 'block' }} />
    </ControlButton>
  );
};
