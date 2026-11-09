import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { BulletList } from '../mod.ts';
import { BulletList as UI } from '../ui.tsx';
import { toggle } from '../u.toggle.ts';

type Id = 'file-content' | 'playback-content';

const items = [
  { id: 'file-content' },
  { kind: 'content', key: 'help-outside-id-union', render: () => 'Help' },
  { id: 'playback-content' },
] as const satisfies readonly t.BulletList.Item<Id>[];

describe('BulletList public type contract', () => {
  it('public leaf → implementation identity and readonly literal-ID round trip', () => {
    expect(BulletList.UI).to.equal(UI);
    expect(BulletList.toggle).to.equal(toggle);
    const selected: t.BulletList.Selected<Id> = [];
    const node = (
      <BulletList.UI
        items={items}
        selected={selected}
        onActivate={({ id }) => {
          expectTypeOf(id).toEqualTypeOf<Id>();
          const next = BulletList.toggle(selected, id);
          expectTypeOf(next).toEqualTypeOf<readonly Id[]>();
        }}
      />
    );
    expect(node.type).to.equal(UI);
    const next = BulletList.toggle(Object.freeze(['file-content'] as const), 'playback-content');
    expectTypeOf(next).toEqualTypeOf<readonly Id[]>();
    expect(next).to.eql(['file-content', 'playback-content']);
  });

  it('inference comes from items, not an unsafe narrowed callback', () => {
    const narrow: t.BulletList.Activate.Handler<'file-content'> = () => {};
    // @ts-expect-error: playback-content can be delivered to this handler.
    const invalid = <BulletList.UI items={items} onActivate={narrow} />;
    expect(invalid.type).to.equal(UI);
    // @ts-expect-error: the old callback spelling is deliberately removed.
    const legacy = <BulletList.UI items={items} onSelect={() => {}} />;
    expect(legacy.type).to.equal(UI);
  });
});
