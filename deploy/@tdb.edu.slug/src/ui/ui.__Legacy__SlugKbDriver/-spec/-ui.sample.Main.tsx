import React from 'react';
import { type t, Color, css, Prose, Spinners } from './common.ts';

export type SampleFileContentProps = {
  data?: t.FileContentData;
  loading?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const SampleFileContent: React.FC<SampleFileContentProps> = (props) => {
  const { debug = false, loading = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({
      display: 'relative',
      minWidth: 280,
      maxWidth: 380,
      padding: 30,
      border: `dashed 1px ${Color.alpha(theme.fg, 0.1)}`,
      borderRadius: 10,
      lineHeight: 2.3,
      backgroundColor: Color.ruby(0.06),
      filter: loading ? `blur(4px) grayscale(100%)` : undefined,
      opacity: loading ? 0.2 : 1,
      transition: 'opacity 100ms ease',
    }),
    spinner: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
  };

  const elSpinner = loading && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );
  const hasData = !!props.data;

  return (
    <div className={css(styles.base, props.style).class}>
      {elSpinner}
      <div className={styles.body.class}>
        {!loading && !hasData && <div>{'No content selected'}</div>}
        {hasData && <Prose.Manuscript.UI theme={theme.name} />}
      </div>
    </div>
  );
};
