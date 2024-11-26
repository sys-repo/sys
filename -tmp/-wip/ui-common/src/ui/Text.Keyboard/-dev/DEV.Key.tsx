import { COLORS, Color, TextSyntax, css, type t } from './-common.ts';

export const DevKeyDefaults = { SPACING: 4 };

export type DevKeyProps = {
  edge: 'Left' | 'Right';
  label?: string | JSX.Element;
  isPressed?: boolean;
  isEdge?: boolean;
  spacing?: number;
  paddingX?: number;
  style?: t.CssValue;
};

export const DevKey: React.FC<DevKeyProps> = (props) => {
  const { label = '?', isPressed = false, isEdge = false, paddingX = 12 } = props;

  const styles = {
    base: css({
      position: 'relative',
      transform: `translate(0, ${isPressed ? 2 : 0}px)`,
      border: `solid 1px ${Color.alpha(COLORS.DARK, 0.5)}`,
      borderRadius: 4,
      backgroundColor: COLORS.WHITE,
      boxShadow: `0 2px 4px 0 ${Color.format(-0.1)}`,
    }),
    bg: css({
      Absolute: 0,
      backgroundColor: isPressed && isEdge ? Color.alpha(COLORS.MAGENTA, 0.04) : undefined,
    }),
    body: css({
      position: 'relative',
      Padding: [7, paddingX, 5, paddingX],
    }),
    label: css({
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: 13,
    }),
  };

  const elLabel =
    typeof label !== 'string' ? label : <TextSyntax text={`<${label}>`} style={styles.label} />;

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.bg} />
      <div {...styles.body}>{elLabel}</div>
    </div>
  );
};
