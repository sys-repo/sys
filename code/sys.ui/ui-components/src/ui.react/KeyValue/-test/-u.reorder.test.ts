import { describe, expect, it, type t } from '../../../-test.ts';
import { sameIds, toReorderModel, toReorderedItems } from '../u.reorder.ts';

describe('KeyValue.u.reorder', () => {
  it('resolves stable item ids from item.id', () => {
    const items: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'b', k: 'bravo' },
    ];

    const model = toReorderModel(items);
    expect(model?.ids).to.eql(['a', 'b']);
    expect(model?.byId.get('a')).to.equal(items[0]);
    expect(model?.byId.get('b')).to.equal(items[1]);
  });

  it('resolves stable item ids from getItemId', () => {
    const items: t.KeyValue.Item[] = [{ k: 'alpha' }, { k: 'bravo' }];

    const model = toReorderModel(items, {
      getItemId: (_item, index) => `item:${index}`,
    });

    expect(model?.ids).to.eql(['item:0', 'item:1']);
  });

  it('prefers getItemId over item.id when both are supplied', () => {
    const items: t.KeyValue.Item[] = [
      { id: 'static:a', k: 'alpha' },
      { id: 'static:b', k: 'bravo' },
    ];

    const model = toReorderModel(items, {
      getItemId: (_item, index) => `caller:${index}`,
    });

    expect(model?.ids).to.eql(['caller:0', 'caller:1']);
  });

  it('returns undefined for missing or duplicate ids', () => {
    const missing: t.KeyValue.Item[] = [{ id: 'a', k: 'alpha' }, { k: 'bravo' }];
    const duplicate: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'a', k: 'bravo' },
    ];

    expect(toReorderModel(missing)).to.equal(undefined);
    expect(toReorderModel(duplicate)).to.equal(undefined);
  });

  it('maps reordered ids back to a fresh item array', () => {
    const items: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'b', k: 'bravo' },
      { id: 'c', k: 'charlie' },
    ];
    const model = toReorderModel(items)!;

    const next = toReorderedItems(['c', 'a', 'b'], model.byId);
    expect(next).to.eql([items[2], items[0], items[1]]);
    expect(next).not.to.equal(items);
  });

  it('returns undefined when reordered ids are not a valid permutation', () => {
    const items: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'b', k: 'bravo' },
    ];
    const model = toReorderModel(items)!;

    expect(toReorderedItems(['missing'], model.byId)).to.equal(undefined);
    expect(toReorderedItems(['a'], model.byId)).to.equal(undefined);
    expect(toReorderedItems(['a', 'a'], model.byId)).to.equal(undefined);
  });

  it('detects identical reorder id lists', () => {
    expect(sameIds(['a', 'b'], ['a', 'b'])).to.equal(true);
    expect(sameIds(['a', 'b'], ['b', 'a'])).to.equal(false);
    expect(sameIds(['a'], ['a', 'b'])).to.equal(false);
  });
});
