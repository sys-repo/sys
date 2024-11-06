import { COLORS, Color, css, type t } from './common.ts';

export type DescriptionProps = {
  text: string;
  isSkipped?: boolean;
  theme: t.ColorTheme;
  style?: t.CssValue;
};

export const Description: React.FC<DescriptionProps> = (props) => {
  const { isSkipped = false, theme } = props;
  const desc = parseDescription(props.text);
  const isDark = theme.is.dark;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      opacity: isSkipped ? 0.3 : 1,
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
    }),
    todo: css({
      backgroundColor: Color.alpha(COLORS.MAGENTA, isDark ? 0.2 : 0.15),
      color: Color.alpha(COLORS.MAGENTA, isDark ? 0.9 : 0.5),
      marginRight: 6,
      PaddingX: 5,
      paddingTop: 4,
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 3,
    }),
    text: css({ Flex: 'x-center-start' }),
    copy: css({ marginLeft: 5, filter: 'scale(0.3)' }),
  };

  const elTodo = desc.isTodo && <div {...styles.todo}>{'TODO'}</div>;

  return (
    <div {...css(styles.base, props.style)}>
      {elTodo}
      <div {...styles.text}>{desc.text}</div>
    </div>
  );
};

/**
 * [Heloers]
 */

function parseDescription(text: string) {
  text = (text || '').trim();
  const isTodo = text.startsWith('TODO:');
  text = text.replace(/^TODO\:/, '').trimStart();
  return { text, isTodo };
}
