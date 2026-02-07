import React from 'react';
import { type t, Color, css, KeyValue, Obj, ObjectView, Spinners } from './common.ts';

export const Result: React.FC<t.ActionProbeView.ResultProps> = (props) => {
  const { debug = false, spinning = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, Scroll: true }),
    body: css({ padding: 10 }),
    spinner: css({ Absolute: 0, pointerEvents: 'none', display: 'grid', placeItems: 'center' }),
    obj: css({ marginTop: 6 }),
  };

  const elSpinner = spinning && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const data = Obj.truncateStrings({ ...(props.response ?? {}) });
  const items = [...(props.items ?? [])];

  const elBody = !spinning && (
    <div className={styles.body.class}>
      {items.length > 0 && <KeyValue.UI theme={theme.name} items={items} />}
      <ObjectView
        name={'http:response'}
        data={data}
        theme={theme.name}
        style={css(styles.obj, items.length > 0 ? undefined : { marginTop: 0 })}
        expand={5}
      />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elSpinner}
      {elBody}
    </div>
  );
};
