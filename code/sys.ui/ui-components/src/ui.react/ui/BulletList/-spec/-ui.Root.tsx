import { BulletList } from '../mod.ts';
import { Color, css, Signal, Str, type t } from './common.ts';

/** Render the specimen; harness registration owns redraw subscriptions. */
export function Root(props: { debug: t.DebugSignals }) {
  const p = props.debug.props;
  const v = Signal.toObject(p);
  const styles = {
    base: css({ fontSize: v.fontSize }),
    customContent: css({ backgroundColor: Color.ruby(0.3), textAlign: 'center' }),
  };

  const samples: Record<typeof v.sample, readonly t.BulletList.Item[]> = {
    standard: [
      { id: 'localhost' },
      { id: 'production' },
      { id: 'foobar' },
      {
        kind: 'content',
        key: 'dummy-content',
        render() {
          const cn = styles.customContent.class;
          return <div className={cn}>dummy content row</div>;
        },
      },
      { id: 'long', label: Str.Lorem.words(10) },
      { id: 'disabled', enabled: false },
    ],
    stress: [
      { id: 'short', label: 'Short' },
      { id: 'wrapped', label: 'A longer label that wraps beside its short neighbor' },
      { id: 'token', label: 'LongUnbrokenToken'.repeat(6) },
      {
        id: 'break',
        label: (
          <>
            First line<br />Second line<br />Third line
          </>
        ),
      },
      {
        id: 'rich',
        label: (
          <>
            An <em>emphasized</em> and <strong>strong</strong> label
          </>
        ),
      },
      {
        kind: 'content',
        key: 'help',
        render() {
          const cn = styles.customContent.class;
          return <div className={cn}>content cell, outside the buttons</div>;
        },
      },
      {
        id: 'disabled',
        label: 'Disabled wrapped label for first-line marker alignment',
        enabled: false,
      },
    ],
    empty: [],
  };

  return (
    <div dir={v.rtl ? 'rtl' : 'ltr'} className={styles.base.class}>
      <BulletList.UI
        debug={v.debug}
        theme={v.theme}
        selected={v.selected ?? []}
        columns={v.columns}
        size={v.size}
        items={samples[v.sample]}
        onActivate={(e) => {
          if (v.multiple || e.is.command) {
            p.selected.value = BulletList.toggle(p.selected.value, e.id);
            return;
          }
          p.selected.value = e.id;
        }}
      />
    </div>
  );
}
