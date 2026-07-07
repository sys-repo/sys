import { describe, expect, it, type t } from '../../../-test.ts';
import { sameIds, toReorderChange, toReorderModel, toReorderedItems } from '../u/u.reorder.ts';

describe('KeyValue.u.reorder', () => {
  it('resolves stable item ids from item.id', () => {
    const items: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'b', k: 'bravo' },
    ];

    const model = toReorderModel(items);
    expect(model?.ids).to.eql(['a', 'b']);
    expect(model?.items).to.equal(items);
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

  it('returns undefined for missing, blank, or duplicate ids', () => {
    const missing: t.KeyValue.Item[] = [{ id: 'a', k: 'alpha' }, { k: 'bravo' }];
    const blank: t.KeyValue.Item[] = [{ id: 'a', k: 'alpha' }, { id: ' ', k: 'blank' }];
    const duplicate: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'a', k: 'bravo' },
    ];

    expect(toReorderModel(missing)).to.equal(undefined);
    expect(toReorderModel(blank)).to.equal(undefined);
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

  it('treats recursive groups as atomic direct children', () => {
    const group: t.KeyValue.Group = {
      id: 'group:status',
      kind: 'group',
      items: [
        { id: 'status', k: 'status' },
        { id: 'status:title', k: 'title status' },
      ],
    };
    const items: t.KeyValue.Item[] = [group, { id: 'events', k: 'events' }];

    const model = toReorderModel(items)!;
    const next = toReorderedItems(['events', 'group:status'], model.byId);

    expect(model.ids).to.eql(['group:status', 'events']);
    expect(model.byId.has('status')).to.equal(false);
    expect(model.byId.has('status:title')).to.equal(false);
    expect(toReorderedItems(['status', 'events'], model.byId)).to.equal(undefined);
    expect(next).to.eql([items[1], group]);
    expect(next?.[1]).to.equal(group);
  });

  it('ignores nested identity collisions while rejecting direct-child collisions', () => {
    const nestedCollision: t.KeyValue.Item[] = [
      {
        id: 'group:status',
        kind: 'group',
        items: [{ id: 'events', k: 'nested duplicate of parent sibling' }],
      },
      { id: 'events', k: 'events' },
    ];
    const directCollision: t.KeyValue.Item[] = [
      { id: 'events', k: 'events' },
      { id: 'events', k: 'duplicate direct sibling' },
    ];

    expect(toReorderModel(nestedCollision)?.ids).to.eql(['group:status', 'events']);
    expect(toReorderModel(directCollision)).to.equal(undefined);
  });

  it('passes only direct children to getItemId', () => {
    const seen: string[] = [];
    const items: t.KeyValue.Item[] = [
      {
        id: 'group:status',
        kind: 'group',
        items: [{ id: 'status', k: 'status' }],
      },
      { id: 'events', k: 'events' },
    ];

    const model = toReorderModel(items, {
      getItemId: (item) => {
        seen.push(item.id ?? '(missing)');
        return item.id;
      },
    });

    expect(model?.ids).to.eql(['group:status', 'events']);
    expect(seen).to.eql(['group:status', 'events']);
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

  it('classifies repeated reorder ids as unchanged and copies input ids', () => {
    const items: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'b', k: 'bravo' },
    ];
    const model = toReorderModel(items)!;
    const input = ['a', 'b'];

    const res = toReorderChange({ nextIds: input, previousIds: model.ids, byId: model.byId });

    expect(res?.changed).to.equal(false);
    expect(res?.next).to.eql(items);
    expect(res?.ids).to.eql(['a', 'b']);
    expect(res?.ids).not.to.equal(input);

    input.reverse();
    expect(res?.ids).to.eql(['a', 'b']);
  });

  it('classifies return-to-original ids as changed against previous local ids', () => {
    const items: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'b', k: 'bravo' },
    ];
    const model = toReorderModel(items)!;

    const res = toReorderChange({
      nextIds: ['a', 'b'],
      previousIds: ['b', 'a'],
      byId: model.byId,
    });

    expect(res?.changed).to.equal(true);
    expect(res?.ids).to.eql(['a', 'b']);
    expect(res?.next).to.eql(items);
  });

  it('returns undefined for invalid reorder change permutations', () => {
    const items: t.KeyValue.Item[] = [
      { id: 'a', k: 'alpha' },
      { id: 'b', k: 'bravo' },
    ];
    const model = toReorderModel(items)!;
    const previousIds = model.ids;

    expect(toReorderChange({ nextIds: ['missing'], previousIds, byId: model.byId })).to.equal(undefined);
    expect(toReorderChange({ nextIds: ['a'], previousIds, byId: model.byId })).to.equal(undefined);
    expect(toReorderChange({ nextIds: ['a', 'a'], previousIds, byId: model.byId })).to.equal(undefined);
  });

  it('detects identical reorder id lists', () => {
    expect(sameIds(['a', 'b'], ['a', 'b'])).to.equal(true);
    expect(sameIds(['a', 'b'], ['b', 'a'])).to.equal(false);
    expect(sameIds(['a'], ['a', 'b'])).to.equal(false);
  });
});
