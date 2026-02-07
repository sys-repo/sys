import { type t, css, Color } from './common.ts';
import { RunButton } from './ui.btn.Run.tsx';

type HeaderProps = {
  title?: t.ReactNode;
  canRun: boolean;
  spinning: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onRun: () => void;
};

export const Header: React.FC<HeaderProps> = (props) => {
  const { title, canRun, spinning, onRun } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      fontSize: 11,
      fontWeight: 600,
      userSelect: 'none',
      display: 'grid',
      gridTemplateColumns: `auto 1fr auto`,
      Padding: [6, 10],
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{title ?? 'Untitled Probe'}</div>
      <div />
      <div>
        <RunButton canRun={canRun} spinning={spinning} onRun={onRun} theme={theme.name} />
      </div>
    </div>
  );
};
