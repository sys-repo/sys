import { COLORS, css, Spinner, type t, Color } from './common.ts';
import { Suite } from './ui.Suite.tsx';

type R = t.TestSuiteRunResponse;

export type TestResultsProps = {
  data?: R | R[];
  spinning?: boolean;
  scroll?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const TestResults: React.FC<TestResultsProps> = (props) => {
  const { data, spinning = false, scroll = true } = props;

  const list = (Array.isArray(data) ? data : [data]).filter(Boolean) as R[];
  const isEmpty = list.length === 0;
  const ok = list.every((item) => item.ok);

  /**
   * [Render]
   */
  const theme = Color.theme(props.theme);
  const color = theme.fg;
  const styles = {
    base: css({
      position: 'relative',
      fontSize: 13,
      color,
      cursor: 'default',
    }),
    empty: css({
      opacity: 0.4,
      Flex: 'center-center',
      userSelect: 'none',
      fontStyle: 'italic',
      padding: 20,
    }),
    spinner: css({
      Absolute: [25, 0, null, 0],
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({
      position: 'relative',
      Absolute: scroll ? 0 : undefined,
      boxSizing: 'border-box',
      Scroll: scroll,
    }),
    statusMargin: css({
      width: 2,
      Absolute: [0, null, 0, 0],
      backgroundColor: ok ? COLORS.LIME : COLORS.RED,
    }),
  };

  const elSpinner = spinning && (
    <div {...styles.spinner}>
      <Spinner.Puff size={22} color={color} />
    </div>
  );

  const elEmpty = isEmpty && !spinning && <div {...styles.empty}>{'No results to display.'}</div>;

  const elBody = !spinning && (
    <div {...styles.body}>
      {list.map((data) => {
        return <Suite key={data.tx} data={data} spinning={spinning} theme={theme} />;
      })}
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {!isEmpty && <div {...styles.statusMargin} />}
      {elBody}
      {elEmpty}
      {elSpinner}
    </div>
  );
};
