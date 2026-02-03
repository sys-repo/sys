import React from 'react';
import { type t, Color, css, D, KeyValue, Str } from './common.ts';
import { OriginSelector } from './ui.Selector.tsx';

type P = t.DevOriginProps;

export const Origin: React.FC<P> = (props) => {
  const { debug = false, kind = D.kind.default } = props;
  const origins = {
    local: props.default?.origin?.local ?? D.kind.local,
    prod: props.default?.origin?.prod ?? D.kind.prod,
  } as const;

  const current = kind === 'localhost' ? origins.local : origins.prod;

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

  /**
   * KeyValue items:
   */
  const mono = true;
  const items: t.KeyValueItem[] = [];
  if (kind === 'localhost') {
    items.push({ kind: 'title', v: 'Endpoint (Origin)' });
    items.push({ k: 'app,cdn', v: Str.trimHttpScheme(current.app), mono });
  } else {
    items.push({ kind: 'title', v: 'Endpoints (Origin)' });
    items.push({ k: 'app', v: Str.trimHttpScheme(current.app), mono });
    items.push({ k: 'cdn', v: Str.trimHttpScheme(current.cdn.default), mono });
    items.push({ k: 'cdn.video', v: Str.trimHttpScheme(current.cdn.video), mono });
  }

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.selector.class}>
        <OriginSelector theme={theme.name} kind={props.kind} onChange={props.onChange} />
      </div>
      <div className={styles.divider.class} />
      <KeyValue.UI theme={theme.name} items={items} />
    </div>
  );
};
