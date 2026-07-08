import { describe, expect, it } from '../../../../-test.ts';
import { D, type t } from '../common.ts';
import { resolveFields, toggleField, toItemFields } from '../u.fields.ts';
import { toSwitchItems, toSwitchItemSections } from '../u.items.tsx';
import { toReorder } from '../u.reorder.ts';

type Field = t.Files.InfoPanel.Field;
type Row = t.KeyValue.Switches.Row;

describe('Files.InfoPanel.Config', () => {
  describe('field projection', () => {
    it('resolves default fields from the component defaults', () => {
      expect(resolveFields(undefined)).to.eql(D.fields);
    });

    it('deduplicates configured fields while preserving caller order', () => {
      const input: Field[] = ['events', 'status', 'events', 'fidelity', 'status'];
      expect(resolveFields(input)).to.eql(['events', 'status', 'fidelity']);
    });

    it('toggles fields with canonical insertion fallback', () => {
      const fields: Field[] = ['error', 'events'];

      expect(toggleField(fields, 'events', false)).to.eql(['error']);
      expect(toggleField(fields, 'capabilities', true)).to.eql(['capabilities', 'error', 'events']);
      expect(toggleField(fields, 'error', true)).to.eql(['error', 'events']);
    });

    it('projects visible fields first and hidden fields after them', () => {
      expect(toItemFields(['error', 'status'])).to.eql([
        'error',
        'status',
        'status:title',
        'fidelity',
        'capabilities',
        'events',
      ]);
    });
  });

  describe('switch rows', () => {
    it('emit field changes as event payloads', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['status', 'error'];
      const items = toSwitchItems(
        {
          fields,
          onFieldsChange(e) {
            emitted = e.next;
          },
        },
        fields,
        toItemFields(fields),
      );
      const row = switchRowById(items, 'capabilities');

      row.onToggle?.(true, { item: row, index: 0 });

      expect(emitted).to.eql(['status', 'capabilities', 'error']);
    });

    it('groups status fields as one recursive switch item', () => {
      const fields: Field[] = ['status', 'status:title', 'error'];
      const items = toSwitchItems({ fields }, fields, toItemFields(fields));

      expect(itemIds(items)).to.eql(['group:status', 'error', 'fidelity', 'capabilities', 'events']);

      const group = items[0] as t.KeyValue.Switches.Group;
      expect(group.kind).to.equal('group');
      expect(group.id).to.equal('group:status');
      expect(itemIds(group.items)).to.eql(['status', 'status:title']);
      expect(switchRowById(group.items, 'status').value).to.equal(true);
      expect(switchRowById(group.items, 'status:title').value).to.equal(true);
    });

    it('places the status group at the first status-member position', () => {
      const fields: Field[] = ['error', 'status'];
      const items = toSwitchItems({ fields }, fields, toItemFields(fields));
      const group = items[1] as t.KeyValue.Switches.Group;

      expect(itemIds(items)).to.eql(['error', 'group:status', 'fidelity', 'capabilities', 'events']);
      expect(itemIds(group.items)).to.eql(['status', 'status:title']);
      expect(switchRowById(group.items, 'status').value).to.equal(true);
      expect(switchRowById(group.items, 'status:title').value).to.equal(false);
    });

    it('partitions hidden rows outside the reorderable visible section', () => {
      const fields: Field[] = ['events', 'status', 'capabilities'];
      const items = toSwitchItems({ fields }, fields, toItemFields(fields));
      const sections = toSwitchItemSections(items, fields);

      expect(itemIds(sections.visible)).to.eql(['events', 'group:status', 'capabilities']);
      expect(itemIds(sections.hidden)).to.eql(['fidelity', 'error']);
    });

    it('keeps a hidden status sibling inside a visible status group', () => {
      const fields: Field[] = ['status'];
      const items = toSwitchItems({ fields }, fields, toItemFields(fields));
      const sections = toSwitchItemSections(items, fields);
      const group = sections.visible[0] as t.KeyValue.Switches.Group;

      expect(itemIds(sections.visible)).to.eql(['group:status']);
      expect(itemIds(group.items)).to.eql(['status', 'status:title']);
      expect(switchRowById(group.items, 'status').value).to.equal(true);
      expect(switchRowById(group.items, 'status:title').value).to.equal(false);
    });
  });

  describe('reorder', () => {
    it('emits visible fields only', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['status', 'error'];
      const reorder = toReorder({ onFieldsChange: (e) => emitted = e.next }, fields);

      reorder?.onChange?.({
        next: [
          { id: 'error', k: 'error' },
          { id: 'capabilities', k: 'capabilities' },
          { id: 'status', k: 'status' },
        ],
      });

      expect(emitted).to.eql(['error', 'status']);
    });

    it('does not gate reorder on projection animation', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['status', 'error'];
      const reorder = toReorder(
        { animation: false, onFieldsChange: (e) => emitted = e.next },
        fields,
      );

      reorder?.onChange?.({
        next: [
          { id: 'error', k: 'error' },
          { id: 'status', k: 'status' },
        ],
      });

      expect(emitted).to.eql(['error', 'status']);
    });

    it('flattens recursive groups back to visible field order', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['status', 'status:title', 'error'];
      const reorder = toReorder({ onFieldsChange: (e) => emitted = e.next }, fields);

      reorder?.onChange?.({
        next: [
          { id: 'error', k: 'error' },
          {
            id: 'group:status',
            kind: 'group',
            items: [
              { id: 'status', k: 'status' },
              { id: 'status:title', k: 'title status' },
            ],
          },
          { id: 'capabilities', k: 'capabilities' },
        ],
      });

      expect(emitted).to.eql(['error', 'status', 'status:title']);
    });

    it('ignores hidden grouped fields while preserving visible group movement', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['error', 'status'];
      const reorder = toReorder({ onFieldsChange: (e) => emitted = e.next }, fields);

      reorder?.onChange?.({
        next: [
          {
            id: 'group:status',
            kind: 'group',
            items: [
              { id: 'status', k: 'status' },
              { id: 'status:title', k: 'title status' },
            ],
          },
          { id: 'error', k: 'error' },
        ],
      });

      expect(emitted).to.eql(['status', 'error']);
    });

    it('ignores recursive reorder payloads with duplicate visible fields', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['status', 'error'];
      const reorder = toReorder({ onFieldsChange: (e) => emitted = e.next }, fields);

      reorder?.onChange?.({
        next: [
          {
            id: 'group:status',
            kind: 'group',
            items: [
              { id: 'status', k: 'status' },
              { id: 'status', k: 'status duplicate' },
            ],
          },
          { id: 'error', k: 'error' },
        ],
      });

      expect(emitted).to.equal(undefined);
    });
  });
});

/**
 * Helpers:
 */
function switchRowById(items: t.KeyValue.Switches.Item[], id: Field): Row {
  const row = findSwitchRowById(items, id);
  if (!row) throw new Error(`Missing switch row: ${id}`);
  return row;
}

function findSwitchRowById(items: t.KeyValue.Switches.Item[], id: Field): Row | undefined {
  for (const item of items) {
    if ('kind' in item && item.kind === 'group') {
      const row = findSwitchRowById(item.items, id);
      if (row) return row;
      continue;
    }
    if ('id' in item && item.id === id) return item as Row;
  }
}

function itemIds(items: t.KeyValue.Switches.Item[]): string[] {
  return items.flatMap((item) => item.id ?? []);
}
