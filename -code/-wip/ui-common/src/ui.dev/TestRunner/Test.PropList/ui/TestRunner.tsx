import { useEffect, useState } from 'react';
import { Util } from '../u';
import {
  Button,
  COLORS,
  Color,
  DEFAULTS,
  Spinner,
  Time,
  css,
  rx,
  useMouse,
  type t,
} from '../common';
import { Results } from './ui.Results';

export type TestRunnerProps = {
  data?: t.TestPropListData;
  enabled?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

export const TestRunner: React.FC<TestRunnerProps> = (props) => {
  const { data } = props;
  const results = Wrangle.results(props);
  const isRunning = Wrangle.isRunning(props);
  const isEnabled = Wrangle.isEnabled(props);
  const isButtonVisible = Wrangle.isButtonVisible(props);
  const txs = results.map((m) => m.tx).join();

  const mouse = useMouse();
  const [isColored, setColored] = useState(false);

  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    if (results.length > 0) {
      setColored(true);
      Time.until(dispose$).delay(DEFAULTS.colorDelay, () => setColored(false));
    }

    return dispose;
  }, [txs]);

  const runTestsClick = async (e: React.MouseEvent) => {
    if (!isEnabled) return;
    if (data?.run) {
      const modifiers = Util.modifiers(e);
      await data.run.onRunAll?.({ modifiers });
      mouse.reset();
    }
  };

  /**
   * [Render]
   */
  const theme = Color.theme(props.theme);
  const height = 15;
  const styles = {
    base: css({
      flex: 1,
      height,
      display: 'grid',
      gridTemplateColumns: '1fr auto',
    }),
    spinner: css({
      height,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  const elSpinner = isRunning && (
    <div {...styles.spinner}>
      <Spinner.Bar color={COLORS.GREEN} width={35} />
    </div>
  );

  const elButton = !isRunning && isButtonVisible && (
    <Button onClick={runTestsClick} enabled={isEnabled} theme={theme.name}>
      <Results results={results} isColored={isColored} isOver={mouse.is.over} theme={theme} />
    </Button>
  );

  const elResultsOnly = !isRunning && !isButtonVisible && results.length > 0 && (
    <Results
      results={results}
      isColored={isColored}
      isOver={mouse.is.over}
      isRunnable={false}
      theme={theme}
    />
  );

  return (
    <div {...css(styles.base, props.style)} {...mouse.handlers}>
      <div />
      <div>
        {elSpinner}
        {elButton}
        {elResultsOnly}
      </div>
    </div>
  );
};

/**
 * Helpers
 */
const Wrangle = {
  isEnabled(props: TestRunnerProps) {
    return props.enabled ?? true;
  },

  isRunning(props: TestRunnerProps) {
    if (!Wrangle.isEnabled(props)) return false;
    const results = props.data?.specs?.results ?? {};
    return Object.values(results).some((value) => typeof value === 'boolean');
  },

  isButtonVisible(props: TestRunnerProps) {
    const run = props.data?.run ?? {};
    return run.button !== 'hidden';
  },

  results(props: TestRunnerProps) {
    const results = props.data?.specs?.results ?? {};
    const res = Object.values(results).filter((value) => typeof value === 'object');
    return res as t.TestSuiteRunResponse[];
  },
};
