import { type t, Color, css, D } from './common.ts';
import { TabStrip } from './ui.TabStrip.tsx';

type P = t.Tabs.Props;

export const Tabs: t.FC<P> = (props) => {
  const { items = [] } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
    }),
    tabstrip: css({}),
    body: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <TabStrip {...props} style={styles.tabstrip} />
      <div className={styles.body.class}>
        <div>body</div>
      </div>
    </div>
  );
};
