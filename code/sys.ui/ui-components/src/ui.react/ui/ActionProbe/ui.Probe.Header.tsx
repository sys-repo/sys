import { type t, css, Color } from './common.ts';
import { RunButton } from './ui.Probe.RunButton.tsx';

type HeaderProps = {
  title?: t.ReactNode;
  canRun: boolean;
  spinning: boolean;
  focused?: boolean;
  actOn?: t.ActionProbe.ActOn;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onRun: () => void;
};

export const Header: React.FC<HeaderProps> = (props) => {
  const { title, canRun, spinning, focused = false, actOn, onRun } = props;

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
      alignItems: 'center',
      Padding: [5, 10],
    }),
    title: css({}),
    run: css({ alignSelf: 'center', transform: 'translateY(1px)' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{title ?? 'Untitled Probe'}</div>
      <div />
      <div className={styles.run.class}>
        <RunButton
          canRun={canRun}
          spinning={spinning}
          focused={focused}
          actOn={actOn}
          onRun={onRun}
          theme={theme.name}
        />
      </div>
    </div>
  );
};
