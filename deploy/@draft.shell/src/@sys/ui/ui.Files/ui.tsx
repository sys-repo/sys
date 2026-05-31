import { type t, Color, css, D, KeyValue } from './common.ts';
import { toItems } from './u.items.ts';

const layout = { kind: 'spaced', columnGap: 10 } satisfies t.KeyValue.Layout;

export const InfoPanel: t.FC<t.FileInfoPanel.Props> = (props) => {
  const { debug = false } = props;
  const items = toItems(props);
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      <KeyValue.UI theme={theme.name} layout={layout} items={items} />
    </div>
  );
};
