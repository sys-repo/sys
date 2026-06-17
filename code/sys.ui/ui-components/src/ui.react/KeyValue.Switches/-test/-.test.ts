import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
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
      const row = Switches.toItem({ id: 'events', value: true });

      expectTypeOf(row).toEqualTypeOf<t.KeyValue.Row>();
      expect(row.kind).to.equal('row');
      expect(row.k).to.equal('events');
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

    it('maps undefined input to an empty item list', () => {
      expect(Switches.toItems()).to.eql([]);
    });
  });
});
