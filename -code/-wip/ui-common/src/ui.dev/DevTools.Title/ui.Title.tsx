import { DEFAULTS, FC, Style, css, type t } from './common';

export type TitleProps = {
  text?: string | [string, string];
  style?: t.DevTitleStyle;
  onClick?: () => void;
};

const View: React.FC<TitleProps> = (props) => {
  const text = Wrangle.text(props);

  /**
   * [Render]
   */
  const style = { ...DEFAULTS.style, ...props.style };
  const styles = {
    base: css({
      ...Style.toMargins(style.margin),
      cursor: props.onClick ? 'pointer' : 'default',
      userSelect: 'none',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto',
      columnGap: 8,
    }),
    ellipsis:
      style.ellipsis &&
      css({
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }),
    text: css({
      color: style.color,
      opacity: style.opacity ?? DEFAULTS.style.opacity,
      fontSize: style.size ?? DEFAULTS.style.size,
      fontWeight: style.bold ? 'bold' : undefined,
      fontStyle: style.italic ? 'italic' : undefined,
    }),
  };
  return (
    <div {...styles.base} onClick={props.onClick}>
      <div {...css(styles.text, styles.ellipsis)}>{text[0]}</div>
      <div />
      <div {...css(styles.text, styles.ellipsis)}>{text[1]}</div>
    </div>
  );
};

/**
 * Helpers
 */

const Wrangle = {
  text(props: TitleProps): [string, string] {
    const text = Array.isArray(props.text) ? props.text : [props.text];
    const left = text[0] ?? DEFAULTS.title;
    const right = text[1] ?? '';
    return [left, right];
  },
};

/**
 * Export
 */
type Fields = {
  DEFAULTS: typeof DEFAULTS;
};
export const Title = FC.decorate<TitleProps, Fields>(
  View,
  { DEFAULTS },
  { displayName: DEFAULTS.displayName },
);
