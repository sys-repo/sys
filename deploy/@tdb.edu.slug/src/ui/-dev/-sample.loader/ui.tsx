import React from 'react';
import { type t, Color, css, Obj, ObjectView, Spinners } from './common.ts';

/**
 * Component:
 */
export type SampleLoaderProps = {
  spinning?: boolean;
  response?: unknown;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const SampleLoader: React.FC<SampleLoaderProps> = (props) => {
  const { debug = false, spinning = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      Scroll: true,
    }),
    body: css({
      padding: 10,
    }),
    spinner: css({ Absolute: 0, pointerEvents: 'none', display: 'grid', placeItems: 'center' }),
  };

  const elSpinner = spinning && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );

  const data = Obj.truncateStrings({ ...(props.response ?? {}) });

  const elBody = !spinning && (
    <div className={styles.body.class}>
      <ObjectView name={'http:response'} data={data} theme={theme.name} expand={5} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elSpinner}
      {elBody}
    </div>
  );
};
