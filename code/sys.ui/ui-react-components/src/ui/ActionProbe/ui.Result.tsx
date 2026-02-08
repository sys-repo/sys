import React from 'react';
import { type t, Color, css, KeyValue, Obj, D, ObjectView, Spinners } from './common.ts';

export const Result: React.FC<t.ActionProbe.ResultProps> = (props) => {
  const { debug = false, spinning = false, sizeMode = D.Result.sizeMode } = props;
  const obj = props.obj;

  const data = Obj.truncateStrings({ ...(props.response ?? {}) });
  const items = [...(props.items ?? [])];
  const hasItems = items.length > 0;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    spinner: css({
      Absolute: 0,
      pointerEvents: 'none',
      display: 'grid',
      placeItems: 'center',
    }),
    body: {
      base: css({
        position: 'relative',
        display: 'grid',
        gridTemplateRows: hasItems ? `auto auto 1fr` : '1fr',
        pointerEvents: spinning ? 'none' : 'auto',
        filter: `blur(${spinning ? 6 : 0}px) grayscale(${spinning ? 100 : 0}%)`,
        opacity: spinning ? 0.4 : 1,
        transition: 'opacity 100ms ease',
      }),
      top: css({ padding: 10 }),
      hr: css({ borderTop: `solid 1px ${Color.alpha(theme.fg, 0.1)}` }),
      bottom: {
        base: css({ position: 'relative' }),
        inner: css({
          padding: 10,
          Scroll: sizeMode === 'fill' ? true : undefined,
          Absolute: sizeMode === 'fill' ? 0 : undefined,
        }),
      },
    },
    obj: css({}),
  };

  const elSpinner = spinning && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const elBody = (
    <div className={styles.body.base.class}>
      {hasItems && (
        <div className={styles.body.top.class}>
          <KeyValue.UI theme={theme.name} items={items} mono={props.header?.mono ?? true} />
        </div>
      )}
      {hasItems && <div className={styles.body.hr.class} />}
      <div className={styles.body.bottom.base.class}>
        <div className={styles.body.bottom.inner.class}>
          <ObjectView
            name={'action:result'}
            data={data}
            theme={theme.name}
            style={css(styles.obj, hasItems ? undefined : { marginTop: 0 })}
            expand={obj?.expand ?? 5}
            show={obj?.show}
            sortKeys={obj?.sortKeys}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elSpinner}
      {elBody}
    </div>
  );
};
