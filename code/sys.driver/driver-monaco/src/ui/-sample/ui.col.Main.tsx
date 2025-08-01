import React from 'react';

import { type t, Color, css, Spinners } from './common.ts';
import { getLazy } from './u.factory.tsx';

type P = t.SampleProps & { hasErrors?: boolean };

export const MainColumn: React.FC<P> = (props) => {
  const { repo, signals, factory, hasErrors } = props;
  const def = signals.main.value;
  const Lazy = def ? getLazy(def.component, factory.getView) : null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      opacity: hasErrors ? 0.2 : 1,
      transition: 'opacity 120ms ease',
    }),
    spinner: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
    empty: css({
      Absolute: 0,
      display: 'grid',
      placeItems: 'center',
      opacity: 0.25,
    }),
  };

  const elSpinner = (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );
  const elEmpty = !def && <div className={styles.empty.class}>{'Nothing to display'}</div>;

  const elBody = (
    <React.Suspense fallback={elSpinner}>
      {Lazy && <Lazy data={def!.props} repo={repo} theme={props.theme} />}
    </React.Suspense>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elBody}
      {elEmpty}
    </div>
  );
};
