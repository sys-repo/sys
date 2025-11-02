import { type t, Color, css, ObjectView } from '../common.ts';
import { makeRegistry } from '../mod.ts';
export const registry = makeRegistry();

/**
 * Sample Component:
 */
export function Sample(props: { prefix?: string; ctx: t.SlugViewProps }) {
  const { prefix = '', ctx } = props;

  const theme = Color.theme(ctx.theme);
  const styles = {
    base: css({
      Padding: [15, 25],
      color: theme.fg,
      minWidth: 280,
    }),
    obj: css({
      marginTop: 10,
      marginLeft: 15,
    }),
    title: css({ fontSize: 36 }),
  };

  return (
    <div className={styles.base.class}>
      <div className={styles.title.class}>{'🐷'}</div>
      {`${prefix} render view: "${ctx.view}"`.trim()}
      <ObjectView data={ctx} theme={theme.name} name={'ctx'} expand={1} style={styles.obj} />
    </div>
  );
}
