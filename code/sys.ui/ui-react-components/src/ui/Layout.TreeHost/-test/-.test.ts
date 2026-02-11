import { describe, expect, it } from '../../../-test.ts';

import { Data } from '../m.Data.ts';
import { TreeHost } from '../mod.ts';
import { type t } from '../common.ts';
import { shouldRenderEmpty } from '../u.slot.ts';

describe('Layout.TreeHost', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components');
    expect(m.TreeHost).to.equal(TreeHost);
    expect(TreeHost.Data).to.equal(Data);
  });

  describe('spinner', () => {
    const base: t.TreeHostProps = { theme: 'Light' };

    it('renders empty when no spinner and no content', () => {
      expect(shouldRenderEmpty({ props: base, slot: 'main', hasContent: false })).to.eql(true);
    });

    it('suppresses empty when spinner targets same slot', () => {
      expect(
        shouldRenderEmpty({
          props: { ...base, spinner: { slot: 'main', position: 'middle' } },
          slot: 'main',
          hasContent: false,
        }),
      ).to.eql(false);
    });

    it('does not suppress empty when spinner targets a different slot', () => {
      expect(
        shouldRenderEmpty({
          props: { ...base, spinner: { slot: 'tree', position: 'top' } },
          slot: 'main',
          hasContent: false,
        }),
      ).to.eql(true);
    });

    it('treats treeLeaf spinner as tree slot spinner', () => {
      expect(
        shouldRenderEmpty({
          props: { ...base, spinner: { slot: 'treeLeaf', position: 'top' } },
          slot: 'tree',
          hasContent: false,
        }),
      ).to.eql(false);
    });
  });
});
