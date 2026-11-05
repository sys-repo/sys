import { useEffect, useState } from 'react';

import { css, Is, type t } from './common.ts';
import { focusStyle } from './u.focus.ts';
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
    }),
  };

  const focus = focusStyle(styles.base, theme, props.style);

  const handleOnClick = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    props.onClick?.(e);
    props.onToggle?.({ current: value, next: !value, synthetic: e });
  };

  const overHandler = (isOver: boolean): React.MouseEventHandler => {
    return (e) => {
      if (!isEnabled) return;
      if (isOver) props.onMouseEnter?.(e);
      if (!isOver) props.onMouseLeave?.(e);
    };
  };

  const downHandler = (isDown: boolean): React.MouseEventHandler => {
    return (e) => {
      if (!isEnabled) return;
      if (isDown) props.onMouseDown?.(e);
      if (!isDown) props.onMouseUp?.(e);
    };
  };

  return (
    <button
      id={props.id}
      className={focus.class}
      type='button'
      role='switch'
      aria-checked={value}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
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
function toTheme(input?: t.CommonTheme | Partial<t.Switch.Theme.Root>): t.Switch.Theme.Root {
  let theme = input || 'Light';
  if (Is.str(theme)) theme = SwitchTheme.fromName(theme).blue;
  return theme as t.Switch.Theme.Root;
}
