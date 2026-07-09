import { useEffect, useState } from 'react';

import { Color, css, type t } from './common.ts';
import { SwitchTheme } from './u.theme.ts';
import { SwitchThumb } from './ui.Thumb.tsx';
import { SwitchTrack } from './ui.Track.tsx';

/** Animated on/off switch renderer. */
export const Switch: React.FC<t.Switch.Props> = (props) => {
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
      display: 'block',
      boxSizing: 'border-box',
      width,
      height,
      margin: 0,
      padding: 0,
      appearance: 'none',
      WebkitAppearance: 'none',
      border: 0,
      borderRadius: height / 2,
      background: 'transparent',
      color: 'inherit',
      font: 'inherit',
      opacity: isEnabled ? 1 : theme.disabledOpacity,
      cursor: isEnabled ? 'pointer' : 'default',
      outline: 'none',
      ':focus': { outline: 'none' },
      ':focus-visible': {
        outline: 'none',
        boxShadow: `0 0 0 3px ${toFocusRingColor(theme)}`,
      },
    }),
  };

  const handleOnClick = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    props.onClick?.(e);
    props.onToggle?.({ current: value, next: !value, synthetic: e });
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
      }
    };
  };

  return (
    <button
      className={css(styles.base, props.style).class}
      type="button"
      role="switch"
      aria-checked={value}
      disabled={!isEnabled}
      title={props.tooltip}
      onClick={handleOnClick}
      onMouseEnter={overHandler(true)}
      onMouseLeave={overHandler(false)}
      onMouseDown={downHandler(true)}
      onMouseUp={downHandler(false)}
    >
      <SwitchTrack track={track} switch={args} />
      <SwitchThumb thumb={thumb} switch={args} />
    </button>
  );
};

/**
 * Helpers:
 */
function toFocusRingColor(theme: t.Switch.Theme.Root): string {
  const color = theme.trackColor.on;
  return typeof color === 'string' ? Color.alpha(color, 0.28) : Color.toGrayAlpha(color);
}

function toTheme(input?: t.CommonTheme | Partial<t.Switch.Theme.Root>): t.Switch.Theme.Root {
  let theme = input || 'Light';
  if (typeof theme === 'string') theme = SwitchTheme.fromName(theme as t.CommonTheme).blue;
  return theme as t.Switch.Theme.Root;
}
