import { type t, Button, Color, css, Icons, Spinners } from './common.ts';

export type RunButtonProps = {
  canRun: boolean;
  spinning: boolean;
  focused?: boolean;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onRun: () => void;
};

/**
 * Component:
 */
export const RunButton: React.FC<RunButtonProps> = (props) => {
  const { canRun, onRun, spinning, focused = false, debug = false } = props;

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

  return (
    <div className={css(styles.base, props.style).class}>
      <Button enabled={canRun && !spinning} disabledOpacity={1} onClick={onRun}>
        {elBody}
      </Button>
    </div>
  );
};
