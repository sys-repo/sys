import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { Dev } from '../mod.ts';
import { DevButton } from '../m.Button/mod.ts';
import { DevDivider } from '../m.Divider/mod.ts';
import { DevLink } from '../m.Link/mod.ts';
import { DevList } from '../m.List/mod.ts';
import { Anchor } from '../../ui/Anchor/mod.ts';

// Type wiring checks intentionally compare the defining spines with the public namespace.
import type { Props as ButtonProps } from '../m.Button/t.ts';
import type { Props as DividerProps } from '../m.Divider/t.ts';
import type { Props as LinkProps } from '../m.Link/t.ts';
import type { Item as ListItem, Props as ListProps } from '../m.List/t.ts';

type Id = 'a' | 'b';

describe('@sys/ui-components/react/dev: exports', () => {
  it('public aggregate → the same callable primitives and leaf contracts', async () => {
    const m = await import('@sys/ui-components/react/dev');
    const production = await import('@sys/ui-components/react/anchor');
    expect(m.Dev).to.equal(Dev);
    expect(m.Dev.Button).to.equal(DevButton);
    expect(m.Dev.Divider).to.equal(DevDivider);
    expect(m.Dev.Link).to.equal(DevLink);
    expect(m.Dev.List).to.equal(DevList);
    expect(m.Dev.Link).not.to.equal(production.Anchor.Link);
    expect(production.Anchor.Link).to.equal(Anchor.Link);
    expectTypeOf<t.Dev.Button.Props>({}).toEqualTypeOf<ButtonProps>();
    expectTypeOf<t.Dev.Divider.Props>({}).toEqualTypeOf<DividerProps>();
    expectTypeOf<t.Dev.Link.Props>({ children: 'Label' }).toEqualTypeOf<LinkProps>();
    const item: t.Dev.List.Item<Id> = { id: 'a', label: 'A', onActivate: () => {} };
    expectTypeOf(item).toEqualTypeOf<ListItem<Id>>();
    expectTypeOf<t.Dev.List.Props<Id>>({ items: [item] }).toEqualTypeOf<ListProps<Id>>();
    expectTypeOf(m.Dev.List).toEqualTypeOf<t.Dev.Lib['List']>();
    expectTypeOf(m.Dev.Link).toEqualTypeOf<t.FC<t.Anchor.Link.Props>>();
  });
});
