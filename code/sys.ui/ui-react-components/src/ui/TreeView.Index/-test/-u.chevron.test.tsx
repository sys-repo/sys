import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { resolveShowChevron } from '../u.chevron.ts';

describe('TreeView.Index chevron modes', () => {
  const STUB_NODE: t.TreeViewNode = {
    path: ['stub'] as t.ObjectPath,
    key: 'stub',
    label: 'stub',
    children: [],
  };
  const INLINE_NODE: t.TreeViewNode = {
    path: ['inline'] as t.ObjectPath,
    key: 'inline',
    label: 'inline',
    children: [{ path: ['inline', 'child'] as t.ObjectPath, key: 'inline/child', label: 'child' }],
  };

  describe('resolveShowChevron', () => {
    it('auto hides stub children', () => {
      expect(resolveShowChevron(STUB_NODE, 'auto')).to.equal(false);
    });

    it('always shows stub children', () => {
      expect(resolveShowChevron(STUB_NODE, 'always')).to.equal(true);
    });

    it('never hides stub children', () => {
      expect(resolveShowChevron(STUB_NODE, 'never')).to.equal(false);
    });

    it('auto follows inline children', () => {
      expect(resolveShowChevron(INLINE_NODE, 'auto')).to.equal(true);
    });

    it('never overrides inline children', () => {
      expect(resolveShowChevron(INLINE_NODE, 'never')).to.equal(false);
    });
  });

  describe('resolveChevron', () => {});
});
