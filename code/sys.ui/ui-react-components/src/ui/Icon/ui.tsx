import { type t, Color, Style, css } from './common.ts';

type P = t.IconViewProps;

/**
 * The renderer of the <SVG> icon.
 */
export const IconView: React.FC<P> = (props) => {
  const { size = 24, opacity } = props;
  const Component = props.type;

  const styles = {
    base: css({
      display: 'inline-block',
      overflow: 'hidden',
      Size: size,
      transform: wrangle.transform(props),
      opacity: opacity === undefined ? 1 : opacity,
      ...Style.toMargins(props.margin),
    }),
  };

  return (
    <div
      className={css(styles.base, props.style).class}
      tabIndex={props.tabIndex}
      title={props.tooltip}
      onClick={props.onClick}
      onDoubleClick={props.onDoubleClick}
      onMouseDown={props.onMouseDown}
      onMouseUp={props.onMouseUp}
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
    >
      <Component size={size} color={wrangle.color(props)} />
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  color(props: P) {
    return props.color ? Color.format(props.color) : undefined;
  },

  transform(props: P) {
    const { offset, flipX, flipY } = props;
    let res = '';
    if (offset) res += ` translate(${offset[0]}px, ${offset[1]}px)`;
    if (flipX) res += ` scaleX(-1)`;
    if (flipY) res += ` scaleY(-1)`;
    return res.trim() || undefined;
  },
} as const;
