import React from 'react';
import { type t, A, Color, css, Is, KeyValue, Obj, Rx, Str, Time } from './common.ts';

type P = t.DocumentProps;
type Stats = {
  snapshotBytes: number;
  numChanges: number;
  numOps: number;
};

const PATH = { meta: ['.meta'] };

export const Document: React.FC<P> = (props) => {
  const { debug = false, doc } = props;

  /**
   * Hooks:
   */
  const [stats, setStats] = React.useState<Stats>();

  /**
   * Effects:
   */
  React.useEffect(() => {
    if (!doc) return;

    function update() {
      const current = doc?.current;
      setStats(current ? getStats(current) : undefined);
    }

    const ev = doc.events();
    ev.$.pipe(Rx.debounceTime(300)).subscribe(update);
    update();

    return ev.dispose;
  }, [doc?.id]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
    }),
  };

  const items = wrangle.items(props, stats);

  return (
    <div className={css(styles.base, props.style).class}>
      <KeyValue.View mono={true} items={items} theme={theme.name} />
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  items(props: P, stats?: Stats): t.KeyValueItem[] {
    const { doc } = props;
    const items: t.KeyValueItem[] = [];
    if (!doc) return items;

    const x = [10, 0] as const;
    items.push({ kind: 'title', v: 'CRDT Document', y: [0, 10] });

    if (doc) {
      const meta = Obj.Lens.bind<t.SysMeta>(doc.current, PATH.meta);
      const { createdAt } = meta.get() ?? {};

      items.push({ k: 'Identity' });
      items.push({ k: 'Document', v: `crdt:${doc.id}`, x });
      items.push({ k: 'Ref', v: `instance-${doc.instance}`, x });
      if (Is.num(createdAt)) {
        const elapsed = Time.elapsed(createdAt);
        items.push({ k: 'Created', v: `${elapsed.toString()} ago`, x });
      }
    }

    if (stats) {
      items.push({ kind: 'hr' });
      items.push({ k: 'Size' });
      items.push({ k: 'Serialized', v: `${Str.bytes(stats.snapshotBytes)}`, x });
      items.push({ k: 'Changes', v: stats.numChanges.toLocaleString(), x });
      items.push({ k: 'Operations', v: stats.numOps.toLocaleString(), x });
    }

    return items;
  },
} as const;

function getStats<T>(doc: A.Doc<T>): Stats {
  const snapshotBytes = A.save(doc).byteLength;
  const { numChanges, numOps } = A.stats(doc);
  return { snapshotBytes, numChanges, numOps };
}
