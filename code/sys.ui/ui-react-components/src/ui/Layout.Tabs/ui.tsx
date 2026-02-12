import { type t, Color, css, D } from './common.ts';
import { TabStrip } from './ui.TabStrip.tsx';

type P = t.Tabs.Props;

export const Tabs: t.FC<P> = (props) => {
  const { items = [] } = props;
  const selectedId = wrangle.selectedId(props);
  const selectedItem = items.find((item) => item.id === selectedId);

  /**
   * Handlers:
   */
  const onChange: t.Tabs.ChangeHandler = (e) => {
    props.onChange?.(e);
  };

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
    body: css({ minHeight: 0, display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <TabStrip {...props} value={selectedId} onChange={onChange} style={styles.tabstrip} />
      <div className={styles.body.class}>{selectedItem?.render({ theme: theme.name })}</div>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  selectedId(props: P) {
    const { items = [], value, defaultValue } = props;
    const ids = new Set(items.map((item) => item.id));

    if (value !== undefined && ids.has(value)) return value;
    if (defaultValue !== undefined && ids.has(defaultValue)) return defaultValue;
    return items[0]?.id;
  },
} as const;
