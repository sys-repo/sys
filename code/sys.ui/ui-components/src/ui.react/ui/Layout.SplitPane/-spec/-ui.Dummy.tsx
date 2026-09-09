import { type t, Color, css } from '../../-test.ui.ts';
import { Cropmarks } from '../../Cropmarks/mod.ts';

export function Dummy(props: { children?: t.ReactNode; theme?: t.CommonTheme }) {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', display: 'grid', padding: 15 }),
    body: css({
      backgroundColor: Color.ruby(0.1),
      border: `dashed 1px ${Color.alpha(theme.fg, 0.2)}`,
      display: 'grid',
    }),
    inner: css({ padding: 8 }),
  };
  return (
    <div className={styles.base.class}>
      <div className={styles.body.class}>
        <Cropmarks theme={theme.name}>
          <div className={styles.inner.class}>{props.children}</div>
        </Cropmarks>
      </div>
    </div>
  );
}
