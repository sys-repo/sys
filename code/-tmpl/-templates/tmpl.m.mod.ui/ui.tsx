import { Color, css, D, type t } from './common.ts';
import { useScopedStyles } from './use.Styles.ts';

export const MyComponent: t.FC<t.MyComponent.Props> = (props) => {
  const component = D.displayName;
  const theme = Color.theme(props.theme);
  const scoped = useScopedStyles({ component, theme }); // ← 🐷 optional scoped styles.

  /**
   * Render:
   */
  const styles = {
    base: css({
      backgroundColor: Color.ruby(0),
      color: theme.fg,
      padding: 10,
    }),
  };

  return (
    <div className={css(styles.base, scoped, props.style).class} data-component={component}>
      <div>{`🐷 ${D.displayName}`}</div>
    </div>
  );
};
