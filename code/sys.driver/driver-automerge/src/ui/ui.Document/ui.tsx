import React from 'react';
import { type t, Color, css, KeyValue, Rx, Spinners } from './common.ts';
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
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),
    spinner: css({
      Absolute: 0,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const isLoading = !!doc && !stats;
  const elSpinner = isLoading && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View mono={true} items={items} theme={theme.name} />
      {elSpinner}
    </div>
  );
};
