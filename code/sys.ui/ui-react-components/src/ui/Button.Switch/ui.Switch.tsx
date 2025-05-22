import { useEffect, useState } from 'react';

import { css, type t } from './common.ts';
import { SwitchTheme } from './u.theme.ts';
import { SwitchThumb } from './ui.Thumb.tsx';
import { SwitchTrack } from './ui.Track.tsx';

export const Switch: React.FC<t.SwitchProps> = (props) => {
  const { track = {}, thumb = {} } = props;
  const theme = toTheme(props.theme);
  const height = props.height ?? 32;
  const width = props.width ?? height * 2 - height * 0.4;
  const transitionSpeed = props.transitionSpeed ?? 200;
  const isEnabled = props.enabled ?? true;
  const value = Boolean(props.value);

  const [isDown, setIsDown] = useState<boolean>(false);
  const [isOver, setIsOver] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const args = {
    isLoaded,
    isEnabled,
    value,
    theme,
    width,
    height,
    transitionSpeed,
  };

  /**
   * Effects:
   */
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      width,
      height,
      opacity: isEnabled ? 1 : theme.disabledOpacity,
    }),
  };

  const handleOnClick = (e: React.MouseEvent) => {
    if (e.button === 0 && props.onClick) {
      props.onClick(e);
    }
  };

  const overHandler = (isOver: boolean): React.MouseEventHandler => {
    return (e) => {
      setIsOver(isOver);
      if (!isOver && isDown) setIsDown(false);
      if (isEnabled) {
        if (isOver && props.onMouseEnter) props.onMouseEnter(e);
        if (!isOver && props.onMouseLeave) props.onMouseLeave(e);
      }
    };
  };

  const downHandler = (isDown: boolean): React.MouseEventHandler => {
    return (e) => {
      setIsDown(isDown);
      if (isEnabled) {
        if (isDown && props.onMouseDown) props.onMouseDown(e);
        if (!isDown && props.onMouseUp) props.onMouseUp(e);
        if (!isDown && props.onClick) handleOnClick(e);
      }
    };
  };

  return (
    <div
      {...css(styles.base, props.style)}
      title={props.tooltip}
      onMouseEnter={overHandler(true)}
      onMouseLeave={overHandler(false)}
      onMouseDown={downHandler(true)}
      onMouseUp={downHandler(false)}
    >
      <SwitchTrack track={track} switch={args} />
      <SwitchThumb thumb={thumb} switch={args} />
    </div>
  );
};

/**
 * Helpers:
 */
function toTheme(input?: t.CommonTheme | Partial<t.SwitchTheme>): t.SwitchTheme {
  let theme = input || 'Light';
  if (typeof theme === 'string') {
    theme = SwitchTheme.fromString(theme as t.CommonTheme).blue;
  }
  return theme as t.SwitchTheme;
}
