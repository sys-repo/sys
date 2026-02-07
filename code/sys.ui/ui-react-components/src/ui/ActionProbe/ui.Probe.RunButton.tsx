import { type t, Button, Color, css, Icons } from './common.ts';

export type RunButtonProps = {
  canRun: boolean;
  spinning: boolean;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  onRun: () => void;
};

/**
 * Component:
 */
export const RunButton: React.FC<RunButtonProps> = (props) => {
  const { canRun, spinning, onRun, debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg }),
    body: css({
      display: 'grid',
      placeItems: 'center',
      gridTemplateColumns: `auto auto`,
      columnGap: 1,
    }),
    icon: css({}),
    label: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button enabled={canRun && !spinning} onClick={onRun}>
        <div className={styles.body.class}>
          <Icons.Play size={12} style={styles.icon} offset={[0, -1]} />
          <div className={styles.label.class}>{spinning ? 'Running...' : 'Run'}</div>
        </div>
      </Button>
    </div>
  );
};
