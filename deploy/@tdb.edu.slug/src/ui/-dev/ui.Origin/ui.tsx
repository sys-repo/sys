import React from 'react';
import { type t, Color, css, D, KeyValue, Str } from './common.ts';
import { OriginSelector } from './ui.Selector.tsx';

type P = t.DevLoaderProps;

export const Origin: React.FC<P> = (props) => {
  const { debug = false, origin = D.origin.default } = props;
  const origins = {
    local: props.default?.origin?.local ?? D.origin.local,
    prod: props.default?.origin?.prod ?? D.origin.prod,
  } as const;

  const current = origin === 'localhost' ? origins.local : origins.prod;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      fontSize: 12,
      display: 'grid',
      gridTemplateColumns: `auto auto 1fr`,
      gap: 20,
    }),
    selector: css({ display: 'grid', alignItems: 'start' }),
    divider: css({ borderRight: `solid 1px ${Color.alpha(theme.fg, 0.1)}` }),
  };

  const mono = true;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.selector.class}>
        <OriginSelector theme={theme.name} origin={props.origin} onChange={props.onOriginChange} />
      </div>
      <div className={styles.divider.class} />
      <KeyValue.UI
        theme={theme.name}
        items={[
          { kind: 'title', v: 'Endpoints (Origin)' },
          { k: 'app', v: Str.trimHttpScheme(current.app), mono },
          { k: 'cdn', v: Str.trimHttpScheme(current.cdn.default), mono },
          { k: 'cdn.video', v: Str.trimHttpScheme(current.cdn.video), mono },
        ]}
      />
    </div>
  );
};
