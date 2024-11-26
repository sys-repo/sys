import { useEffect, useState } from 'react';
import { Button, COLORS, DEFAULTS, DevIcons, Time, css, rx, type t } from '../common';
import { RunIcon } from './ui.Row.RunIcon';

export type BodyProps = {
  theme: t.ColorTheme;
  data: t.TestPropListData;
  suite?: t.TestSuiteModel | undefined;
  isSelected?: boolean;
  enabled?: boolean;
  style?: t.CssValue;
  onClick?: React.MouseEventHandler;
};

export const Body: React.FC<BodyProps> = (props) => {
  const { isSelected, suite, enabled = true, theme } = props;
  const hash = suite?.hash() ?? '';
  const isRunning = Wrangle.isRunning(props, hash);
  const ellipsis = Wrangle.ellipsis(props);
  const ok = Wrangle.ok(props, hash);

  const [isOver, setOver] = useState(false);
  const [isColored, setColored] = useState(false);
  const iconColor = isColored || isOver ? Wrangle.iconColor(ok) : undefined;

  /**
   * Lifecycle
   */
  useEffect(() => {
    const { dispose, dispose$ } = rx.disposable();
    if (typeof ok === 'boolean') {
      Time.until(dispose$).delay(DEFAULTS.colorDelay, () => setColored(false));
      setColored(true);
    }
    return dispose;
  }, [ok]);

  /**
   * [Render]
   */
  const styles = {
    base: css({}),
    body: css({
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '1fr auto auto',
    }),
    runIcon: css({}),
    resultIcons: css({ marginLeft: 5, marginRight: 3, paddingTop: 1 }),
    description: css({ paddingTop: 1 }),
    ellipsis: css({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
    icon: css({
      color: iconColor,
      display: 'grid',
      placeItems: 'center',
      transition: 'all 0.15s ease-in-out',
    }),
  };

  const elIcoPassed = ok === true && <DevIcons.Test.Passed size={13} style={styles.icon} />;
  const elIcoFailed = ok === false && <DevIcons.Test.Failed size={13} style={styles.icon} />;

  const elRunIcon = (
    <RunIcon
      enabled={enabled}
      isSelected={isSelected}
      isOver={isOver}
      isRunning={isRunning}
      iconColor={iconColor}
      theme={theme}
      style={styles.runIcon}
    />
  );

  const elResultIcons = (
    <div {...styles.resultIcons}>
      {elIcoPassed}
      {elIcoFailed}
    </div>
  );

  const elDescription = (
    <div {...css(styles.description, ellipsis ? styles.ellipsis : false)}>
      {suite?.description ?? ''}
    </div>
  );

  return (
    <Button
      style={css(styles.base, props.style)}
      theme={theme.name}
      enabled={enabled}
      onClick={props.onClick}
      onMouse={(e) => setOver(e.isOver)}
    >
      <div {...styles.body}>
        {elDescription}
        {elResultIcons}
        {elRunIcon}
      </div>
    </Button>
  );
};

/**
 * Helpers
 */
const Wrangle = {
  ellipsis(props: BodyProps) {
    const ellipsis = props.data.specs?.ellipsis ?? DEFAULTS.ellipsis;
    return typeof ellipsis === 'function' ? ellipsis() : ellipsis;
  },

  results(props: BodyProps, hash: string) {
    const results = props.data.specs?.results;
    return results ? results[hash] : false;
  },

  isRunning(props: BodyProps, hash: string) {
    return Wrangle.results(props, hash) === true;
  },

  ok(props: BodyProps, hash: string) {
    const results = Wrangle.results(props, hash);
    return typeof results === 'object' ? results.ok : undefined;
  },

  iconColor(ok?: boolean, isOver?: boolean) {
    if (ok === undefined) return COLORS.DARK;
    return ok ? COLORS.GREEN : COLORS.RED;
  },
};
