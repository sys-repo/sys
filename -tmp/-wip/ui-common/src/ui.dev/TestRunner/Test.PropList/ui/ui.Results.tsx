import { COLORS, DevIcons, Test, Time, Value, css, type t } from '../common';
import { RunIcon } from './ui.Row.RunIcon';

export type ResultsProps = {
  theme: t.ColorTheme;
  isColored?: boolean;
  isOver?: boolean;
  isRunnable?: boolean;
  results?: t.TestSuiteRunResponse[];
  style?: t.CssValue;
};

export const Results: React.FC<ResultsProps> = (props) => {
  const { theme, results = [], isOver = false, isColored = true, isRunnable = true } = props;
  const stats = Test.Stats.merge(results);

  const color = theme.fg;
  const asColor = (value: string) => (isColored ? value : color);

  /**
   * [Render]
   */
  const styles = {
    base: css({ position: 'relative', Flex: 'x-center-center', height: 15, color }),
    item: css({ Flex: 'x-center-center', transition: 'all 0.15s ease-in-out' }),
    failed: css({ color: asColor(COLORS.RED) }),
    passed: css({ color: asColor(COLORS.GREEN) }),
    skipped: css({ color: asColor(COLORS.YELLOW), opacity: isColored ? 1 : 0.3 }),
    elapsed: css({ color }),
    spacer: css({ width: 6 }),
    runIcon: css({ marginRight: 2, transform: 'translateY(1px)' }),
    runAgain: css({ marginLeft: 3, transition: 'opacity 0.15s ease-in-out' }),
  };

  /**
   * No results (first run required)
   */
  if (!results || stats.total === 0) {
    return (
      <div {...styles.base}>
        <DevIcons.Test.Run size={12} color={color} style={styles.runIcon} /> {'run tests'}
      </div>
    );
  }

  /**
   * Results exist.
   */
  const { passed, failed } = stats;
  const skipped = stats.skipped + stats.only;
  const msecs = results.map((e) => e.time.elapsed).reduce((acc, msecs) => acc + msecs, 0);
  const elapsed = Time.duration(msecs);

  const items: JSX.Element[] = [];
  const push = (el: JSX.Element) => {
    if (items.length > 0) items.push(<div {...styles.spacer} key={`gap.${items.length}`} />);
    items.push(el);
  };

  if (failed > 0) {
    const title = Wrangle.title(failed, 'failed');
    push(
      <div {...css(styles.failed, styles.item)} key={title} title={title}>
        <DevIcons.Test.Failed size={14} /> {failed}
      </div>,
    );
  }

  if (passed > 0) {
    const title = Wrangle.title(passed, 'passed');
    push(
      <div {...css(styles.passed, styles.item)} key={title} title={title}>
        <DevIcons.Test.Passed size={14} /> {passed}
      </div>,
    );
  }

  if (skipped > 0) {
    const title = Wrangle.title(skipped, 'skipped');
    push(
      <div {...css(styles.skipped, styles.item)} key={title} title={title}>
        <DevIcons.Test.Skipped size={14} style={{ transform: 'scaleX(-1)' }} /> {skipped}
      </div>,
    );
  }

  if (elapsed.msec > 0) {
    const title = 'Re-run tests';
    push(
      <div
        {...css(styles.elapsed, styles.item)}
        key={'elapsed'}
        title={title}
      >{`in ${elapsed}`}</div>,
    );
  }

  const runAgainColor = isOver ? COLORS.BLUE : isColored ? COLORS.GREEN : undefined;
  const elRunAgain = isRunnable && (
    <div {...styles.runAgain}>
      <RunIcon isSelected={true} iconColor={runAgainColor} theme={theme} />
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {items}
      {elRunAgain}
    </div>
  );
};

/**
 * [Helpers]
 */
const Wrangle = {
  title(total: number, suffix: string) {
    const tests = Value.plural(total, 'test', 'tests');
    return `${total} ${tests} ${suffix}`;
  },
};
