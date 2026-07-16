import { Color, css, D, type t } from './common.ts';

type P = t.Chip.Props;

export const Chip: t.FC<P> = (props) => {
  const { debug = false, mono = D.mono, size = D.size } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const fontScale = wrangle.fontScale(size);
  const styles = {
    base: css({
      color: 'inherit',
      display: 'inline-block',
      fontFamily: mono ? 'monospace' : undefined,
      fontSize: `${fontScale}em`,
      lineHeight: 1.14,
      verticalAlign: 'baseline',
      backgroundColor: Color.alpha(theme.fg, 0.06),
      border: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      borderRadius: '0.285em',
      padding: '0.095em 0.285em',
      whiteSpace: 'nowrap',
      backgroundClip: 'padding-box',
      outline: debug ? `solid 1px ${Color.ruby(0.4)}` : undefined,
    }),
  };

  return (
    <span className={css(styles.base, props.style).class} data-component={D.displayName}>
      {props.children}
    </span>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  fontScale(size: t.Chip.Size) {
    if (size === 'xs') return 0.78;
    if (size === 'md') return 1;
    return 0.875;
  },
} as const;
