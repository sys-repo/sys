import { useMemo } from 'react';
import { Time, Tree, css, type t } from './common.ts';
import { Description } from './ui.Test.Description.tsx';
import { TestResult } from './ui.Test.tsx';

export type SuiteResultsProps = {
  data: t.TestSuiteRunResponse;
  theme: t.ColorTheme;
  style?: t.CssValue;
};

export const SuiteResults: React.FC<SuiteResultsProps> = (props) => {
  const { data, theme } = props;
  const elapsed = Time.duration(data.time.elapsed).toString();

  const isEmpty = useMemo(() => Tree.Results.isEmpty(data), [data.id]);
  if (isEmpty) return null;

  /**
   * [Render]
   */
  const styles = {
    base: css({ position: 'relative' }),
    body: css({ paddingLeft: 10 }),
    title: {
      base: css({ Flex: 'horizontal-stretch-stretch', marginBottom: 4 }),
      description: css({ flex: 1 }),
      elapsed: css({ opacity: 1, userSelect: 'none' }),
    },
  };

  const elTests = data.tests.map((test) => <TestResult key={test.id} data={test} theme={theme} />);
  const elChildren = data.children.map((suite) => (
    <SuiteResults key={suite.id} data={suite} theme={theme} />
  ));

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.title.base}>
        <Description text={data.description} style={styles.title.description} theme={theme} />
        <div {...styles.title.elapsed}>{elapsed}</div>
      </div>
      <div {...styles.body}>
        {elTests}
        {elChildren}
      </div>
    </div>
  );
};
