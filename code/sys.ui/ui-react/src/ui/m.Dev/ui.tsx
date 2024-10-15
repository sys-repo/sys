import { Color, css, type t } from './common.ts';

export type DevHarnessProps = {
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const DevHarness: React.FC<DevHarnessProps> = (props) => {
  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      fontFamily: 'sans-serif',
      padding: 30,
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <div>{`🐷 DevHarness`}</div>
    </div>
  );
};
