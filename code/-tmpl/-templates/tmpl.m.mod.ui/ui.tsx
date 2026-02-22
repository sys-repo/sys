import { type t, Color, css, D, KeyValue } from './common.ts';
import { useScopedStyles } from './use.Styles.ts';

export const MyComponent: t.FC<t.MyComponent.Props> = (props) => {
  const { debug = false } = props;
  const { componentAttr } = useScopedStyles(props); // ← 🐷 delete if not using CSS scoped styles.

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(0),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={componentAttr}>
      <div>{`🐷 ${D.displayName}`}</div>
    </div>
  );
};
