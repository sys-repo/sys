import React from 'react';
import { type t, Color, css, KeyValue, Spinners, useDocStats } from './common.ts';
import { toItems } from './u.toItems.ts';

type P = t.DocumentProps;

export const Document: React.FC<P> = (props) => {
  const { debug = false, repo, doc } = props;

  /**
   * Hooks:
   */
  const stats = useDocStats(repo, doc?.id);
  const items = toItems(doc, stats.info);

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
      <KeyValue.UI mono={true} items={items} theme={theme.name} />
      {elSpinner}
    </div>
  );
};
