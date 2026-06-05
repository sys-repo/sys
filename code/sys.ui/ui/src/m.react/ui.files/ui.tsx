import { Color, css, D, KeyValue, type t } from './common.ts';
import { toItems } from './u.items.tsx';

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
      <KeyValue.UI
        theme={theme.name}
        layout={{ kind: 'spaced', columnGap: 10 }}
        items={items}
      />
    </div>
  );
};
