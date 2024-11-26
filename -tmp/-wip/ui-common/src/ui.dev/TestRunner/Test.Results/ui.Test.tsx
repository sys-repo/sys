import { useState } from 'react';
import { Button, COLORS, DevIcons, Time, css, type t } from './common.ts';
import { Description } from './ui.Test.Description.tsx';
import { TestError } from './ui.Test.Error.tsx';

export type TestResultProps = {
  data: t.TestRunResponse;
  theme: t.ColorTheme;
  style?: t.CssValue;
};

export const TestResult: React.FC<TestResultProps> = (props) => {
  const { data, theme } = props;
  const excluded = data.excluded ?? [];
  const isSkipped = excluded.includes('skip');
  const isExcludedViaOnly = excluded.includes('only');
  const isNoop = data.noop;

  const [copied, setCopied] = useState(false);
  const [isOver, setOver] = useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);

  // NB: still show if "skipped" to the test retains visibility
  //     until either implemented or deleted.
  if (isExcludedViaOnly && !isSkipped) return null;

  /**
   * Handlers
   */
  const handleCopy = () => {
    navigator.clipboard.writeText(data.description);
    setCopied(true);
    Time.delay(1200, () => setCopied(false));
  };

  /**
   * Render
   */
  const styles = {
    _base: css({
      position: 'relative',
      marginBottom: 4,
    }),
    get base() {
      return this._base;
    },
    set base(value) {
      this._base = value;
    },
    line: {
      base: css({ display: 'grid', gridTemplateColumns: 'auto 1fr auto' }),
      icon: css({ marginRight: 6 }),
      elapsed: css({ marginLeft: 20, opacity: 0.2, userSelect: 'none' }),
    },
    error: css({ marginLeft: 25 }),
  };

  const elSuccessIcon = !isSkipped && data.ok && (
    <DevIcons.Tick size={16} color={COLORS.LIME} offset={[0, 1]} />
  );
  const elFailIcon = !isSkipped && !data.ok && (
    <DevIcons.Close size={16} color={COLORS.RED} offset={[0, 2]} />
  );
  const elSkippedIcon = isSkipped && (
    <DevIcons.Skip size={16} color={theme.alpha(0.3).fg} offset={[0, 2]} />
  );

  const elCopy = isOver && (
    <Button onClick={handleCopy} theme={theme.name}>
      <DevIcons.Copy size={16} />
    </Button>
  );

  const elIcons = elCopy || (
    <>
      {elSuccessIcon}
      {elFailIcon}
      {elSkippedIcon}
    </>
  );

  const elNoopIcon = isNoop && (
    <DevIcons.Wait size={16} color={theme.alpha(0.5).fg} offset={[0, 2]} />
  );

  const elError = data.error && <TestError data={data} style={styles.error} theme={theme.name} />;

  const elapsed = Time.duration(data.time.elapsed).toString();

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.line.base} onMouseEnter={over(true)} onMouseLeave={over(false)}>
        <div {...styles.line.icon}>{elNoopIcon || elIcons}</div>
        <Description
          text={copied ? '(copied)' : data.description}
          isSkipped={isSkipped}
          theme={theme}
        />
        <div {...styles.line.elapsed}>{isSkipped ? '-' : elapsed}</div>
      </div>
      {elError}
    </div>
  );
};
