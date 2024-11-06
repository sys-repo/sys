import { useEffect, useState } from 'react';
import { Spinner } from '../Spinner/mod.ts';
import { DEFAULTS, Style, css, type t } from './common.ts';
import { Wrangle } from './u.ts';

export const View: React.FC<t.ButtonProps> = (props) => {
  const {
    enabled = DEFAULTS.enabled,
    active = DEFAULTS.active,
    block = DEFAULTS.block,
    disabledOpacity = DEFAULTS.disabledOpacity,
    userSelect = DEFAULTS.userSelect,
    pressedOffset = DEFAULTS.pressedOffset,
    spinning = DEFAULTS.spinning,
    overlay,
    theme,
  } = props;
  const isBlurred = !!(spinning || overlay);
  const isEnabled = enabled;
  const spinner = Wrangle.spinner(props.spinner);

  const [isOver, setOver] = useState(false);
  const [isDown, setDown] = useState(false);

  /**
   * Lifecycle
   */
  useEffect(() => {
    if (!active) {
      setDown(false);
      setOver(false);
    }
  }, [active]);

  /**
   * Handlers
   */
  const over = (isOver: boolean): React.MouseEventHandler => {
    return (e) => {
      if (!active) return;
      setOver(isOver);
      if (!isOver && isDown) setDown(false);
      if (enabled) {
        if (isOver && props.onMouseEnter) props.onMouseEnter(e);
        if (!isOver && props.onMouseLeave) props.onMouseLeave(e);
      }
      props.onMouse?.({
        event: e,
        isOver,
        isDown: !isOver ? false : isDown,
        isEnabled,
        action: isOver ? 'MouseEnter' : 'MouseLeave',
      });
    };
  };

  const down = (isDown: boolean): React.MouseEventHandler => {
    return (e) => {
      if (!active) return;
      setDown(isDown);
      if (enabled) {
        if (isDown && props.onMouseDown) props.onMouseDown(e);
        if (!isDown && props.onMouseUp) props.onMouseUp(e);
        if (!isDown && props.onClick && !isBlurred) props.onClick(e);
      }
      props.onMouse?.({
        event: e,
        isOver,
        isDown,
        isEnabled,
        action: isDown ? 'MouseDown' : 'MouseUp',
      });
    };
  };

  /**
   * [Render]
   */
  const styles = {
    base: css({
      ...Style.toMargins(props.margin),
      ...Style.toPadding(props.padding),
      position: 'relative',
      display: block ? 'block' : 'inline-block',
      minWidth: props.minWidth,
      maxWidth: props.maxWidth,
      opacity: enabled ? 1 : disabledOpacity,
      cursor: enabled && active && !isBlurred ? 'pointer' : 'default',
      userSelect: userSelect ? 'auto' : 'none',
    }),
    body: css({
      color: Wrangle.color({
        isEnabled,
        isOver: !!(isOver || props.isOver),
        theme,
      }),
      transform: Wrangle.pressedOffset({
        isEnabled,
        isOver: !!(isOver || props.isOver),
        isDown: !!(isDown || props.isDown),
        pressedOffset,
      }),
      opacity: isBlurred ? 0.15 : 1,
      filter: `blur(${isBlurred ? 3 : 0}px) grayscale(${isBlurred ? 100 : 0}%)`,
      transition: 'opacity 0.1s ease',
    }),
    spinner: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
    overlay: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
  };

  const elSpinner = spinning && (
    <div {...styles.spinner}>
      <Spinner.Bar
        {...styles.spinner}
        width={spinner.width}
        color={enabled ? spinner.color.enabled : spinner.color.disabled}
      />
    </div>
  );

  const elOverlay = !spinning && overlay && <div {...styles.overlay}>{overlay}</div>;

  return (
    <div
      {...css(styles.base, props.style)}
      role={'button'}
      title={props.tooltip}
      onMouseEnter={over(true)}
      onMouseLeave={over(false)}
      onMouseDown={down(true)}
      onMouseUp={down(false)}
      onDoubleClick={props.onDoubleClick}
    >
      <div {...styles.body}>
        {props.label && <div>{props.label}</div>}
        {props.children}
      </div>
      {elSpinner}
      {elOverlay}
    </div>
  );
};
