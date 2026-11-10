import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { Color, css, D, Str, type t } from './common.ts';
import { BulletList } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const styles = {
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
      <div dir={v.rtl ? 'rtl' : 'ltr'} className={css({ fontSize: v.fontSize }).class}>
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

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.subject.size([p.width.value, null]);
      ctx.redraw();
    }

    Signal.effect(update);
    Harness.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([p.width.value, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
