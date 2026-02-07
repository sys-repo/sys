import { type t, Button, Color, css } from './common.ts';

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
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button enabled={canRun && !spinning} onClick={onRun}>
        {spinning ? 'Running...' : 'Run'}
      </Button>
    </div>
  );
};
