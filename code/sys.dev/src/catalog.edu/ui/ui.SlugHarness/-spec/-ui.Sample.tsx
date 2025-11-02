import { type t, Color, css, ObjectView } from '../common.ts';
import { makeRegistry } from '../mod.ts';
export const registry = makeRegistry();

/**
 * Sample Component:
 */
export function Sample(props: { prefix?: string; ctx: t.SlugViewProps }) {
  const { prefix = '🐷', ctx } = props;

  const theme = Color.theme(ctx.theme);
  const styles = {
    base: css({
      padding: 20,
      color: theme.fg,
      minWidth: 280,
    }),
    obj: css({
      marginTop: 10,
      marginLeft: 22,
    }),
  };

  return (
    <div className={styles.base.class}>
      {`${prefix} view: ${ctx.view}`}
      <ObjectView data={ctx} theme={theme.name} name={'ctx'} expand={1} style={styles.obj} />
    </div>
  );
}
