import { Color, css, D, KeyValue, type t } from './common.ts';
import { toDividerInsertionHandler } from './u.divider.ts';
import { fieldsFromItems, resolveItems, toItemInputs } from './u.fields.ts';
import { toSwitchItems, toSwitchItemSections } from './u.items.tsx';
import { toReorder } from './u.reorder.ts';

type P = t.Files.InfoPanel.Config.Props;

/**
 * Render the Files.InfoPanel configuration controls.
 */
export const UI: t.FC<P> = (props) => {
  const { debug = false } = props;
  const theme = Color.theme(props.theme);
  const visibleItems = resolveItems(props.items, props.fields);
  const fields = fieldsFromItems(visibleItems);
  const itemInputs = toItemInputs(visibleItems);
  const items = toSwitchItems(props, fields, itemInputs, visibleItems);
  const sections = toSwitchItemSections(items, fields);
  const visible = sections.visible;
  const hidden = sections.hidden;
  const hasVisible = visible.length > 0;
  const hasHidden = hidden.length > 0;
  const animation = props.animation ?? D.animation;
  const dividerInsertion = toDividerInsertionHandler({
    enabled: !!props.items && props.cursor?.enabled !== false,
    items: visibleItems,
    current: props.cursor?.model?.current,
    onItemsChange: props.onItemsChange,
  });

  /**
   * Visible rows are reorderable; hidden rows are toggle-only.
   * They must render as separate KeyValue roots, so this parent owns the
   * inter-root rhythm and keeps it equal to the intra-root row rhythm.
   */
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      rowGap: hasVisible && hasHidden ? D.layout.rowGap : undefined,
    }),
  } as const;

  return (
    <div
      className={css(styles.base, props.style).class}
      data-component={D.displayName}
      onKeyDown={dividerInsertion}
    >
      {hasVisible && (
        <KeyValue.Switches.UI
          theme={theme.name}
          layout={D.layout}
          reorder={toReorder(props, visibleItems, fields)}
          animation={animation}
          cursor={props.cursor}
          items={visible}
        />
      )}
      {hasHidden && (
        <KeyValue.Switches.UI
          theme={theme.name}
          layout={D.layout}
          animation={animation}
          cursor={props.cursor}
          items={hidden}
        />
      )}
    </div>
  );
};
