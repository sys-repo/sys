import React from 'react';
import { type t, Button, Color, css, KeyValue, Obj } from './common.ts';

type P = t.SlugLoaderView.ProbeProps;

/**
 * Component:
 */
export const Probe: React.FC<P> = (props) => {
  const { debug = false, sample, is, origin } = props;

  /**
   * State:
   */
  type TArgs = t.SlugLoaderView.ProbeRenderArgs;
  const [body, setBody] = React.useState<t.ReactNode>();
  const [items, setItems] = React.useState<t.KeyValueItem[]>([]);

  /**
   * Effect:
   */
  React.useEffect(() => {
    const theme = props.theme;
    const common = { is, origin };
    setItems([]);

    const args: TArgs = {
      ...common,
      theme,
      item(item) {
        setItems((last) => [...last, item]);
        return args;
      },
    };

    setBody(sample.render(args));
  }, [props.theme, Obj.hash({ is, origin })]);

  console.log('items', items);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      Padding: [8, 12],
      borderRadius: 4,
      border: `dashed 1px ${Color.alpha(theme.fg, 0.25)}`,
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'min-content',
      rowGap: 8,
    }),
    title: {
      base: css({
        fontSize: 11,
        fontWeight: 600,
        userSelect: 'none',
        display: 'grid',
        gridTemplateColumns: `auto 1fr auto`,
      }),
      left: css({}),
      right: css({}),
    },
    body: css({
      fontSize: 11,
      lineHeight: 1.4,
      color: Color.alpha(theme.fg, 0.6),
    }),
  };

  const elTitle = (
    <div className={styles.title.base.class}>
      <div className={styles.title.left.class}>{sample.title ?? 'Untitled Probe'}</div>
      <div />
      <div className={styles.title.right.class}>
        <Button>{'Run'}</Button>
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elTitle}
      {body && <div className={styles.body.class}>{body}</div>}
      {items.length > 0 && <KeyValue.UI theme={theme.name} items={items} mono={true} />}
    </div>
  );
};
