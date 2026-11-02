import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { Dev } from '../mod.ts';
import { ObjectView } from '../../ui/ObjectView/mod.ts';

describe('@sys/ui-components/react/dev: Dev.ObjectView', () => {
  it('aliases the public inspector without changing its props or runtime identity', async () => {
    const m = await import('@sys/ui-components/react/dev');
    const production = await import('@sys/ui-components/react/object-view');
    expect(m.Dev).to.equal(Dev);
    expect(m.Dev.ObjectView).to.equal(ObjectView);
    expect(m.Dev.ObjectView).to.equal(production.ObjectView);
    const props: t.Dev.ObjectView.Props = { data: { count: 1 }, expand: 0 };
    expectTypeOf(props).toEqualTypeOf<t.ObjectViewProps>();
  });
});
