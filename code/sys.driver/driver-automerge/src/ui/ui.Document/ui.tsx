import React from 'react';
import { type t, A, Color, css, Is, KeyValue, Obj, Rx, Str, Time, PATH } from './common.ts';
import { toItems } from './u.items.ts';
import { getStats } from './u.stats.ts';

type P = t.DocumentProps;

export const Document: React.FC<P> = (props) => {
  const { debug = false, doc } = props;

  /**
   * Hooks:
   */
  const [stats, setStats] = React.useState<t.DocumentStats>();
  const items = toItems(doc, stats);

  /**
   * Effects:
   */
  React.useEffect(() => {
    function update() {
      const current = doc?.current;
      setStats(current ? getStats(current) : undefined);
    }

    const ev = doc?.events();
    ev?.$.pipe(Rx.debounceTime(300)).subscribe(update);
    update();

    return ev?.dispose;
  }, [doc?.id]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View mono={true} items={items} theme={theme.name} />
    </div>
  );
};
