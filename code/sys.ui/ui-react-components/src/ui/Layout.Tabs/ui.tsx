import { type t, Color, css, D } from './common.ts';
import { TabStrip } from './ui.TabStrip.tsx';

export const Tabs: t.FC<t.Tabs.Props> = (props) => {
  const { debug = false, items = [] } = props;

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
      <TabStrip theme={theme.name} style={styles.tabstrip} />
      <div className={styles.body.class}>
        <div>body</div>
      </div>
    </div>
  );
};
