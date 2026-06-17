import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { KeyValue } from '../../KeyValue/mod.ts';
import { Switches } from '../mod.ts';

describe('KeyValue.Switches', () => {
  describe('exports', () => {
    it('is attached to the public KeyValue surface', async () => {
      const m = await import('@sys/ui-components/react/key-value');
      expect(m.KeyValue).to.equal(KeyValue);
      expect(m.KeyValue.Switches).to.equal(Switches);
      expect(m.KeyValue.Switches.toItem).to.equal(Switches.toItem);
      expect(m.KeyValue.Switches.toItems).to.equal(Switches.toItems);
    });
  });

  describe('toItem', () => {
    it('maps one switch item to a KeyValue row', () => {
      const opacity: t.KeyValue.Row['opacity'] = { k: 0.3 };
      const row = Switches.toItem({ id: 'events', value: true, opacity });

      expectTypeOf(row).toEqualTypeOf<t.KeyValue.Row>();
      expect(row.kind).to.equal('row');
      expect(row.k).to.equal('events');
      expect(row.opacity).to.equal(opacity);
      expect(row.v).to.not.equal(undefined);
    });
  });

  describe('toItems', () => {
    it('maps items in caller order', () => {
      const items = Switches.toItems([
        { id: 'capabilities', value: true },
        { id: 'events', value: false },
      ]);

      expectTypeOf(items).toEqualTypeOf<t.KeyValue.Item[]>();
      expect(items.map((item) => (item as t.KeyValue.Row).k)).to.eql(['capabilities', 'events']);
    });

    it('preserves hr items in caller order', () => {
      const hr: t.KeyValue.Hr = { kind: 'hr', y: [8, 8] };
      const items = Switches.toItems([{ id: 'before' }, hr, { id: 'after' }]);

      expectTypeOf(items).toEqualTypeOf<t.KeyValue.Item[]>();
      expect(items[1]).to.equal(hr);
      expect((items[0] as t.KeyValue.Row).k).to.equal('before');
      expect((items[2] as t.KeyValue.Row).k).to.equal('after');
    });

    it('maps undefined input to an empty item list', () => {
      expect(Switches.toItems()).to.eql([]);
    });
  });
});
