import { Color, DEFAULTS, Wrangle, css, useMouse, type t } from './common.ts';
import { PropListLabel } from './ui.Label.tsx';
import { PropListValue } from './ui.Value.tsx';
import { useHandler } from './use.Handler.ts';

type P = PropListItemProps;

export type PropListItemProps = {
  item: t.PropListItem;
  is: { first: boolean; last: boolean };
  defaults: t.PropListDefaults;
  enabled?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const PropListItem: React.FC<P> = (props) => {
  const { item, is, defaults } = props;
  const enabled = wrangle.enabled(props);
  const theme = Color.theme(props.theme);
  const hasLabel = !!item.label;
  const selected = Wrangle.selected(item, theme.is.dark);
  const divider = item.divider ?? true;

  const mouse = useMouse();
  const handler = useHandler(props.item, item.onClick, theme.name);

  /**
   * Render
   */
  const noBorder = is.last || !divider;
  const borderColor = theme.alpha(noBorder ? 0 : 0.1).fg;
  const styles = {
    base: css({
      backgroundColor: selected ? Color.format(selected.color) : undefined,
      position: 'relative',
      paddingTop: 4,
      paddingBottom: noBorder ? 0 : 4,
      minHeight: 16,
      cursor: handler.cursor,
      fontSize: DEFAULTS.fontSize.sans,
      borderBottom: `solid ${noBorder ? 0 : 1}px ${borderColor}`,
      ':first-child': { paddingTop: 2 },
      ':last-child': { border: 'none', paddingBottom: 2 },

      display: 'grid',
      gridTemplateColumns: hasLabel ? 'auto 1fr' : '1fr',
      justifyContent: 'center',
      columnGap: '10px',
    }),
  };

  return (
    <div
      {...styles.base}
      title={item.tooltip}
      {...mouse.handlers}
      onMouseDown={(e) => {
        mouse.handlers.onMouseDown(e);
        handler.onClick?.(e);
      }}
    >
      {hasLabel && (
        <PropListLabel
          data={item}
          defaults={defaults}
          enabled={enabled}
          theme={props.theme}
          isMouseOverItem={mouse.is.over}
        />
      )}
      <PropListValue
        item={item}
        hasLabel={hasLabel}
        defaults={defaults}
        enabled={enabled}
        theme={props.theme}
        cursor={handler.cursor}
        message={handler.message}
        isMouseOverItem={mouse.is.over}
      />
    </div>
  );
};

/**
 * Helpers
 */
const wrangle = {
  enabled(props: P) {
    if (props.item?.enabled === false) return false;
    return props.enabled ?? true;
  },
} as const;
