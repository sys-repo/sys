import { Hash as SysHash, COLORS, css, useMouse, type t } from './common.ts';

const DEFAULT = {
  length: [8, 5] as [number, number],
};

export type HashProps = {
  text: string;
  prefix?: string;
  length?: number | [number, number];
  style?: t.CssValue;
};

export const Hash: React.FC<HashProps> = (props) => {
  const text = props.text ?? '';
  const prefix = props.prefix ?? Wrangle.prefix(text);
  const shortened = SysHash.shorten(text, props.length ?? DEFAULT.length, { trimPrefix: true });
  const mouse = useMouse();

  /**
   * [Render]
   */
  const styles = {
    base: css({ Flex: 'x-center-center' }),
    prefix: css({
      textTransform: 'uppercase',
      marginRight: 4,
      fontWeight: 'bold',
      opacity: mouse.is.over ? 0.4 : 0.15,
      color: mouse.is.over ? COLORS.MAGENTA : COLORS.DARK,
      transition: 'opacity 200ms, color 200ms',
      letterSpacing: -0.1,
    }),
    hash: css({}),
  };

  const elPrefix = prefix && <div {...styles.prefix}>{prefix}</div>;
  const elHash = <div {...styles.hash}>{shortened}</div>;

  return (
    <div {...css(styles.base, props.style)} {...mouse.handlers}>
      {elPrefix}
      {elHash}
    </div>
  );
};

/**
 * [Helpers]
 */
const Wrangle = {
  prefix(input: string) {
    const index = input.indexOf('-');
    return index === -1 ? '' : input.substring(0, index);
  },
};
