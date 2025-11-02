import { type t, Color, Crdt, css, Delete, Obj, ObjectView } from '../common.ts';
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
      Padding: [20, 30, 30, 30],
      color: theme.fg,
      minWidth: 280,
    }),
    obj: css({
      marginTop: 10,
      marginLeft: 15,
    }),
    title: {
      base: css({
        borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
        display: 'grid',
        width: '100%',
        overflow: 'hidden',
        gridTemplateColumns: 'auto 1fr',
        gap: 15,
        alignItems: 'center',
      }),
      left: css({ fontSize: 36 }),
      right: css({
        position: 'relative',
        fontSize: 16,
        fontFamily: 'monospace',
      }),
    },
  };

  const doc = ctx.doc;
  const d = {
    doc: {
      field: doc ? `doc(crdt:${doc.id.slice(-5)})` : 'doc',
      value: doc ? Obj.trimStringsDeep(Crdt.toObject(doc.current)) : null,
    },
  };
  const data = {
    ...ctx,
    [d.doc.field]: d.doc.value,
  };
  delete data.doc;

  return (
    <div className={styles.base.class}>
      <div className={css(styles.title.base).class}>
        <div className={styles.title.left.class}>{'🐷'}</div>
        <div className={styles.title.right.class}>{`view: ${String(ctx.view)}`}</div>
      </div>
      <ObjectView
        name={'ctx'}
        data={Delete.undefined(data)}
        theme={theme.name}
        style={styles.obj}
        expand={1}
      />
    </div>
  );
}
