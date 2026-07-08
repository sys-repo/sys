import { Color, css, D, KeyValue, type t } from './common.ts';
import { resolveFields, toItemFields } from './u.fields.ts';
import { toSwitchItems, toSwitchItemSections } from './u.items.tsx';
import { toReorder } from './u.reorder.ts';

type P = t.Files.InfoPanel.Config.Props;

/**
 * Render the Files.InfoPanel configuration controls.
 */
export const UI: t.FC<P> = (props) => {
  const { debug = false } = props;
  const theme = Color.theme(props.theme);
  const fields = resolveFields(props.fields);
  const itemFields = toItemFields(fields);
  const items = toSwitchItems(props, fields, itemFields);
  const sections = toSwitchItemSections(items, fields);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  } as const;

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <KeyValue.Switches.UI
        theme={theme.name}
        layout={{ kind: 'spaced', columnGap: 10 }}
        reorder={toReorder(props, fields)}
        animation={props.animation ?? D.animation}
        items={sections.visible}
      />
      <KeyValue.Switches.UI
        theme={theme.name}
        layout={{ kind: 'spaced', columnGap: 10 }}
        animation={props.animation ?? D.animation}
        items={sections.hidden}
      />
    </div>
  );
};
