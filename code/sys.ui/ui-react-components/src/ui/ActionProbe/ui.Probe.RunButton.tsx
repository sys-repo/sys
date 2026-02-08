import { type t, Button, Color, css, Icons, Is, Spinners, UserAgent } from './common.ts';

export type RunButtonProps = {
  canRun: boolean;
  spinning: boolean;
  focused?: boolean;
  actOn?: t.ActionProbe.ActOn;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onRun: () => void;
};

/**
 * Component:
 */
export const RunButton: React.FC<RunButtonProps> = (props) => {
  const { canRun, onRun, spinning, focused = false, actOn, debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, opacity: focused ? 1 : undefined }),
    body: css({
      position: 'relative',
      display: 'grid',
      placeItems: 'center',
      gridTemplateColumns: `auto auto`,
      columnGap: 0,
    }),
    content: css({ opacity: spinning ? 0 : 1, transition: 'opacity 80ms ease' }),
    spinner: css({ Absolute: 0, display: 'grid', placeItems: 'center' }),
    icon: css({}),
  };

  const elSpinner = spinning && (
    <div className={styles.spinner.class}>
      <Spinners.Bar theme={theme.name} width={20} />
    </div>
  );

  const elBody = (
    <div className={styles.body.class}>
      <Icons.Play size={12} style={css(styles.content, styles.icon)} offset={[0, -1]} />
      <div className={styles.content.class}>{'Run'}</div>
      {elSpinner}
    </div>
  );

  const tooltip = wrangle.tooltip(actOn);

  return (
    <div className={css(styles.base, props.style).class}>
      <Button
        enabled={canRun && !spinning}
        disabledOpacity={1}
        tooltip={tooltip}
        onClick={onRun}
      >
        {elBody}
      </Button>
    </div>
  );
};

const wrangle = {
  tooltip(actOn?: t.ActionProbe.ActOn) {
    if (actOn == null) return undefined;
    const values = Is.array(actOn) ? actOn : [actOn];
    const labels = values
      .filter((value): value is 'Enter' | 'Cmd+Enter' => value !== null)
      .map((value) => (value === 'Cmd+Enter' ? wrangle.commandLabel() : 'Enter'));
    if (labels.length === 0) return undefined;
    if (labels.length === 1) return `Run on ${labels[0]}`;
    return `Run on ${labels.join(' or ')}`;
  },

  commandLabel() {
    const ua = UserAgent.current;
    const cmd =
      ua.is.macOS || ua.is.iOS || ua.is.iPad || ua.is.iPhone ? 'Cmd' : 'Ctrl';
    return `${cmd}+Enter`;
  },
} as const;
