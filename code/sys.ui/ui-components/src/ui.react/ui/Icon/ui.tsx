import type React from 'react';
import { Color, css, Is, Style, type t } from './common.ts';

type P = t.IconViewProps;

/**
 * The renderer of the <SVG> icon.
 */
export const IconView: React.FC<P> = (props) => {
  const { size = 24, opacity } = props;
  const Component = props.type;
  const Root = props.as ?? 'div';

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
    <Root
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
    </Root>
  );
};

/**
 * Helpers
 */
const wrangle = {
  color(props: P) {
    if (props.color == null) return undefined;
    return Is.str(props.color) ? props.color : Color.toGrayAlpha(props.color);
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
