import { COLORS, Color, css, type t } from './common.ts';
import { SuiteResults } from './ui.Suite.Results.tsx';

export type SuiteProps = {
  data: t.TestSuiteRunResponse;
  spinning: boolean;
  theme: t.ColorTheme;
  style?: t.CssValue;
};

export const Suite: React.FC<SuiteProps> = (props) => {
  const { data, spinning, theme } = props;

  /**
   * [Render]
   */
  const styles = {
    base: css({
      position: 'relative',
      filter: `grayscale(${spinning ? 100 : 0}%) blur(${spinning ? 1 : 0}px)`,
      opacity: spinning ? 0.15 : 1,
      backgroundColor: !data.ok ? Color.alpha(COLORS.RED, theme.is.dark ? 0.1 : 0.02) : undefined,
      borderBottom: `dashed 2px ${theme.alpha(0.1).bg}`,
      Padding: [20, 20, 15, 20],
      ':last-child': { borderBottom: 'none' },
    }),
  };

  return (
    <div {...css(styles.base, props.style)}>
      <SuiteResults key={data.tx} data={data} theme={theme} />
    </div>
  );
};
