import { COLORS, Color, Icons, Style, css, type t } from './common.ts';

type Pixels = number;
type CharLength = number;

export type TextSecretProps = {
  text?: string;
  hidden?: boolean;
  hiddenMax?: CharLength;

  style?: t.CssValue;
  monospace?: boolean;
  inlineBlock?: boolean;
  fontSize?: Pixels;
  color?: string | number;
  margin?: t.CssValue['Margin'];
  padding?: t.CssValue['Padding'];
};

export const TextSecret: React.FC<TextSecretProps> = (props) => {
  const {
    inlineBlock = true,
    fontSize = 14,
    hidden = true,
    hiddenMax = 8,
    monospace = false,
  } = props;
  const color = Color.format(props.color ?? COLORS.DARK);

  const text = hidden ? formatHidden(props.text, hiddenMax) : props.text;
  const isEmpty = !text;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      position: 'relative',
      display: inlineBlock ? 'inline-block' : undefined,
      userSelect: hidden ? 'none' : 'auto',
      fontSize,
      fontFamily: monospace && !hidden ? 'monospace' : undefined,
      fontWeight: monospace && !hidden ? 600 : undefined,
      color,
      ...Style.toPadding(props.padding),
      ...Style.toMargins(props.margin),

      Flex: 'x-center-center',
    }),
    icon: css({ marginRight: fontSize / 3 }),
    text: css({}),
    empty: css({
      opacity: 0.3,
      fontSize,
      fontStyle: 'italic',
    }),
  };

  const VisibleIcon = hidden ? Icons.Visibility.Off : Icons.Visibility.On;

  return (
    <div {...css(styles.base, props.style)}>
      {!isEmpty && <VisibleIcon color={color} size={fontSize + 2} style={styles.icon} />}
      {!isEmpty && <div {...styles.text}>{text}</div>}
      {isEmpty && <div {...styles.empty}>(empty)</div>}
    </div>
  );
};

/**
 * Helpers
 */
function formatHidden(input: string | undefined, length: number) {
  const text = (input ?? '').trim();
  if (!text) return '';
  return '●'.repeat(length);
}
