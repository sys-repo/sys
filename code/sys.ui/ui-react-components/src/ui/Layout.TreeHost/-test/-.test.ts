import { describe, expect, it } from '../../../-test.ts';

import { Data } from '../m.Data.ts';
import { TreeHost } from '../mod.ts';
import { type t, Color } from '../common.ts';
import { resolvePartBackground, resolveParts } from '../u.parts.ts';
import { shouldRenderEmpty } from '../u.slot.ts';

describe('Layout.TreeHost', () => {
  it('API', async () => {
    const m = await import('@sys/ui-react-components/layout/tree-host');
    expect(m.TreeHost).to.equal(TreeHost);
    expect(TreeHost.Data).to.equal(Data);
  });

  describe('spinner', () => {
    const base: t.TreeHost.Props = { theme: 'Light' };

    it('renders empty when no spinner and no content', () => {
      expect(shouldRenderEmpty({ props: base, slot: 'main:body', hasContent: false })).to.eql(true);
    });

    it('suppresses empty when spinner targets same slot', () => {
      expect(
        shouldRenderEmpty({
          props: { ...base, spinner: { slot: 'main:body', position: 'middle' } },
          slot: 'main:body',
          hasContent: false,
        }),
      ).to.eql(false);
    });

    it('does not suppress empty when spinner targets a different slot', () => {
      expect(
        shouldRenderEmpty({
          props: { ...base, spinner: { slot: 'nav:tree', position: 'top' } },
          slot: 'main:body',
          hasContent: false,
        }),
      ).to.eql(true);
    });

    it('treats nav:leaf spinner as nav:tree slot spinner', () => {
      expect(
        shouldRenderEmpty({
          props: { ...base, spinner: { slot: 'nav:leaf', position: 'top' } },
          slot: 'nav:tree',
          hasContent: false,
        }),
      ).to.eql(false);
    });

    it('suppresses empty when spinner targets nav:header', () => {
      expect(
        shouldRenderEmpty({
          props: { ...base, spinner: { slot: 'nav:header', position: 'top' } },
          slot: 'nav:header',
          hasContent: false,
        }),
      ).to.eql(false);
    });
  });

  describe('parts', () => {
    it('returns undefined when background is false', () => {
      expect(resolvePartBackground(false, 'Light')).to.eql(undefined);
    });

    it('uses theme background when background is true', () => {
      expect(resolvePartBackground(true, 'Light')).to.eql(Color.theme('Light').bg);
    });

    it('uses resolver return value when background is a function', () => {
      const color = '#ff00aa';
      const result = resolvePartBackground(({ theme }) => {
        expect(theme).to.eql('Dark');
        return color;
      }, 'Dark');
      expect(result).to.eql(color);
    });

    it('applies default parts when parts are omitted', () => {
      const parts = resolveParts({ theme: 'Light' });
      expect(parts.nav.backgroundColor).to.eql(undefined);
      expect(parts.main.backgroundColor).to.eql(Color.theme('Light').bg);
    });
  });
});
