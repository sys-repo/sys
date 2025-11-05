import { useState } from 'react';
import { type t, Button, Color, Crdt, css, Delete, Obj, ObjectView } from '../common.ts';

/**
 * Sample Component:
 */
export function Sample(props: { prefix?: string; ctx: t.SlugViewProps }) {
  const { prefix = '', ctx } = props;

  /**
   * Hooks:
   */
  const [boom, setBoom] = useState(false);
  if (boom) throw new Error('💥 Derp (render-throw to hit ErrorBoundary)');

  /**
   * Render
   */
  const theme = Color.theme(ctx.theme);
  const styles = {
    base: css({
      Padding: [20, 30, 30, 30],
      minWidth: 280,
      color: theme.fg,
      display: 'grid',
      gridAutoFlow: 'row',
      gridAutoRows: 'max-content',
      rowGap: 15,
    }),
    obj: css({
      marginTop: 10,
      marginLeft: 15,
      marginBottom: 15,
    }),
    title: {
      base: css({
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'max-content',
        alignItems: 'center',
        gap: 15,
        borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
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
      <Button label={'click to throw error'} theme={theme.name} onClick={() => setBoom(true)} />
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
