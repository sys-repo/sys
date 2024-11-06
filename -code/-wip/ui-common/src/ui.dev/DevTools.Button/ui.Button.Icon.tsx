import { COLORS, Color, DevIcons, css, type t } from './common';

export type ButtonIconProps = {
  isActive?: boolean;
  isDown?: boolean;
  isOver?: boolean;
  icon?: t.IconRenderer;
  iconElement?: JSX.Element;
  style?: t.CssValue;
};

export const ButtonIcon: React.FC<ButtonIconProps> = (props) => {
  const { isOver, isActive = true, iconElement } = props;
  const Size = 22;
  const color = isOver && isActive ? COLORS.BLUE : Color.alpha(COLORS.DARK, 0.6);
  const Icon = props.icon ?? DevIcons.Method;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      Size,
      display: 'grid',
      placeItems: 'center',
      opacity: isActive ? 1 : 0.3,
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      {iconElement ?? <Icon size={Size} color={color} />}
    </div>
  );
};
