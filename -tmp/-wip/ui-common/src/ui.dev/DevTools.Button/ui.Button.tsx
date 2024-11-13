import { COLORS, DEFAULTS, FC, css, t, useMouse } from './common';
import { ButtonIcon } from './ui.Button.Icon';

export type ButtonProps = {
  enabled?: boolean;
  label?: string | JSX.Element;
  iconElement?: JSX.Element;
  rightElement?: JSX.Element;
  style?: t.CssValue;
  labelOpacity?: number;
  onClick?: React.MouseEventHandler;
};

const View: React.FC<ButtonProps> = (props) => {
  const { label = DEFAULTS.label } = props;

  const mouse = useMouse();
  const isActive = Wrangle.isActive(props);

  /**
   * [Handlers]
   */
  const handlerClick: React.MouseEventHandler = (e) => {
    if (isActive) props.onClick?.(e);
  };

  /**
   * [Render]
   */
  const pressedTransform = `translateY(${isActive && mouse.is.down ? 1 : 0}px)`;
  const styles = {
    base: css({
      position: 'relative',
      userSelect: 'none',
      color: COLORS.DARK,
      fontSize: 12,
      fontFamily: 'monospace',
      fontWeight: 600,
      letterSpacing: 0.2,
      cursor: isActive ? 'pointer' : 'default',
      pointerEvents: isActive ? 'auto' : 'none',

      display: 'inline-grid',
      gridTemplateColumns: 'auto 1fr',
      columnGap: 4,
    }),
    icon: css({
      position: 'relative',
      top: -1,
      marginRight: 4,
      transform: pressedTransform,
    }),
    body: css({
      position: 'relative',
      color: isActive && mouse.is.over ? COLORS.BLUE : COLORS.DARK,
      display: 'grid',
      alignContent: 'center',
      justifyContent: 'start',
      gridTemplateColumns: '1fr auto',
    }),
    left: css({ transform: pressedTransform }),
    right: css({ display: 'grid', placeItems: 'center' }),
    label: css({ opacity: Wrangle.labelOpacity(props) }),
  };

  return (
    <div {...css(styles.base, props.style)} {...mouse.handlers} onClick={handlerClick}>
      <ButtonIcon
        iconElement={props.iconElement}
        isActive={isActive}
        isDown={mouse.is.down}
        isOver={mouse.is.over}
        style={styles.icon}
      />
      <div {...styles.body}>
        <div {...css(styles.left, styles.label)}>{label}</div>
        <div {...styles.right}>{props.rightElement}</div>
      </div>
    </div>
  );
};

/**
 * [Helpers]
 */

const Wrangle = {
  labelOpacity(props: ButtonProps) {
    const { labelOpacity } = props;
    if (!Wrangle.isActive(props)) return 0.3;
    return labelOpacity === undefined ? 1 : labelOpacity;
  },
  isActive(props: ButtonProps): boolean {
    return (props.enabled ?? DEFAULTS.enabled) && Boolean(props.onClick);
  },
};

/**
 * Export
 */
type Fields = {
  DEFAULT: typeof DEFAULTS;
  isActive: typeof Wrangle.isActive;
};
export const Button = FC.decorate<ButtonProps, Fields>(
  View,
  { DEFAULT: DEFAULTS, isActive: Wrangle.isActive },
  { displayName: DEFAULTS.displayName },
);
