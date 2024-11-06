import { Color, Icons, css, format, type t } from './common.ts';
import { useHandler } from './use.Handler.ts';

export type PropListLabelProps = {
  data: t.PropListItem;
  defaults: t.PropListDefaults;
  isMouseOverItem?: boolean;
  enabled?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
  cursor?: t.CssValue['cursor'];
};

export const PropListLabel: React.FC<PropListLabelProps> = (props) => {
  const { enabled = true } = props;
  const theme = Color.theme(props.theme);
  const item = format(props.data);
  const label = item.label;
  const handler = useHandler(props.data, label.onClick, theme.name);
  const hasToggle = !!label.toggle;

  /**
   * Render
   */
  const color = theme.alpha(0.4).fg;
  const styles = {
    base: css({
      userSelect: 'none',
      position: 'relative',
      marginLeft: props.data.indent,
      cursor: enabled ? props.cursor ?? handler.cursor : undefined,
      color,
      display: 'grid',
      alignContent: 'center',
      gridTemplateColumns: `repeat(${hasToggle ? 2 : 1}, auto)`,
    }),
    toggle: css({
      position: 'relative',
      pointerEvents: 'none',
      left: -1,
      transform: `rotate(${label.toggle?.open ? 90 : 0}deg)`,
      transition: 'transform 300ms',
    }),
  };

  const elToggle = hasToggle && <Icons.Triangle.Right size={14} style={styles.toggle} />;

  return (
    <div {...css(styles.base, props.style)} onClick={handler.onClick}>
      {elToggle}
      {handler.message ?? label.body}
    </div>
  );
};
