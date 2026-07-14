import { describe, expect, it } from '../../../../-test.ts';
import { D, type t } from '../common.ts';
import { resolveFields, toggleField, toItemFields } from '../u.fields.ts';
import { toSwitchItems, toSwitchItemSections } from '../u.items.tsx';
import { toReorder } from '../u.reorder.ts';

type Field = t.Files.InfoPanel.Field;
type Row = t.KeyValue.Switches.Row;
type Group = t.KeyValue.Switches.Group;

const legacyStatusTitle = 'status:title' as unknown as Field;

describe('Files.InfoPanel.Config', () => {
  describe('field projection', () => {
    it('resolves default fields from the component defaults', () => {
      expect(resolveFields(undefined)).to.eql(D.fields);
    });

    it('deduplicates configured fields while preserving caller order', () => {
      const input: Field[] = ['events', 'title', 'events', 'fidelity', 'title'];
      expect(resolveFields(input)).to.eql(['events', 'title', 'fidelity']);
    });

    it('maps legacy title status fields to the nested title field tree', () => {
      expect(resolveFields([legacyStatusTitle, 'events'])).to.eql([
        'title',
        'title.status',
        'title.status.label',
        'events',
      ]);
    });

    it('normalizes title descendant dependencies before emitting fields', () => {
      expect(resolveFields(['events', 'title.status.label'])).to.eql([
        'events',
        'title',
        'title.status',
        'title.status.label',
      ]);
    });

    it('toggles fields with canonical insertion fallback', () => {
      const fields: Field[] = ['error', 'events'];

      expect(toggleField(fields, 'events', false)).to.eql(['error']);
      expect(toggleField(fields, 'capabilities', true)).to.eql(['capabilities', 'error', 'events']);
      expect(toggleField(fields, 'error', true)).to.eql(['error', 'events']);
    });

    it('toggles title descendants with parent dependencies', () => {
      expect(toggleField(['events'], 'title.status.label', true)).to.eql([
        'title',
        'title.status',
        'title.status.label',
        'events',
      ]);
      expect(toggleField(['events', 'title'], 'title.status.label', true)).to.eql([
        'events',
        'title',
        'title.status',
        'title.status.label',
      ]);
      expect(toggleField(['title', 'title.status', 'title.status.label', 'events'], 'title', false))
        .to.eql(['events']);
      expect(
        toggleField(['title', 'title.status', 'title.status.label', 'events'], 'title.status', false),
      ).to.eql(['title', 'events']);
    });

    it('projects visible fields first and hidden fields after them', () => {
      expect(toItemFields(['error', 'status'])).to.eql([
        'error',
        'status',
        'title',
        'title.status',
        'title.status.label',
        'fidelity',
        'capabilities',
        'transport',
        'events',
      ]);
    });
  });

  describe('switch rows', () => {
    it('emit field changes as event payloads', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['title', 'error'];
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

      row.onToggle?.({
        current: false,
        next: true,
        item: row,
        index: 0,
        command: {
          name: 'keyvalue-switches:toggle',
          payload: { target: { path: [] }, next: true },
        },
        source: { kind: 'cmd' },
      });

      expect(emitted).to.eql(['title', 'capabilities', 'error']);
    });

    it('labels nested title controls and transport controls', () => {
      const fields: Field[] = ['title', 'title.status', 'title.status.label', 'transport'];
      const items = toSwitchItems({ fields }, fields, toItemFields(fields));

      expect(switchRowById(items, 'title').label).to.eql('title');
      expect(switchRowById(items, 'title.status').label).to.eql('status');
      expect(switchRowById(items, 'title.status.label').label).to.eql('status:label');
      expect(switchRowById(items, 'transport').label).to.eql('network (connection)');
    });

    it('groups title fields as one recursive switch item', () => {
      const fields: Field[] = ['title', 'title.status', 'title.status.label', 'error'];
      const items = toSwitchItems({ fields }, fields, toItemFields(fields));

      expect(itemIds(items)).to.eql([
        'group:title',
        'error',
        'status',
        'fidelity',
        'capabilities',
        'transport',
        'events',
      ]);

      const group = items[0] as Group;
      const statusGroup = group.items[1] as Group;
      expect(group.kind).to.eql('group');
      expect(group.id).to.eql('group:title');
      expect(itemIds(group.items)).to.eql(['title', 'group:title.status']);
      expect(statusGroup.kind).to.eql('group');
      expect(statusGroup.id).to.eql('group:title.status');
      expect(itemIds(statusGroup.items)).to.eql(['title.status', 'title.status.label']);
      expect(switchRowById(group.items, 'title').value).to.eql(true);
      expect(switchRowById(statusGroup.items, 'title.status').value).to.eql(true);
      expect(switchRowById(statusGroup.items, 'title.status.label').value).to.eql(true);
    });

    it('indents nested title switch rows with row spacing', () => {
      const fields: Field[] = ['title'];
      const items = toSwitchItems({ fields }, fields, toItemFields(fields));

      expect(switchRowById(items, 'title').x).to.eql(undefined);
      expect(switchRowById(items, 'title.status').x).to.eql([12, 0]);
      expect(switchRowById(items, 'title.status.label').x).to.eql([12, 0]);
    });

    it('keeps the body status row independent from the title group', () => {
      const fields: Field[] = ['error', 'status', 'title'];
      const items = toSwitchItems({ fields }, fields, toItemFields(fields));

      expect(itemIds(items)).to.eql([
        'error',
        'status',
        'group:title',
        'fidelity',
        'capabilities',
        'transport',
        'events',
      ]);
    });

    it('partitions hidden rows outside the reorderable visible section', () => {
      const fields: Field[] = ['events', 'title', 'capabilities'];
      const items = toSwitchItems({ fields }, fields, toItemFields(fields));
      const sections = toSwitchItemSections(items, fields);
      const titleGroup = sections.visible[1] as Group;

      expect(itemIds(sections.visible)).to.eql(['events', 'group:title', 'capabilities']);
      expect(itemIds(titleGroup.items)).to.eql(['title', 'group:title.status']);
      expect(switchRowById(titleGroup.items, 'title.status').value).to.eql(false);
      expect(itemIds(sections.hidden)).to.eql(['status', 'fidelity', 'error', 'transport']);
    });
  });

  describe('reorder', () => {
    it('emits visible fields only', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['title', 'error'];
      const reorder = toReorder({ onFieldsChange: (e) => emitted = e.next }, fields);

      reorder?.onChange?.({
        next: [
          { id: 'error', k: 'error' },
          { id: 'capabilities', k: 'capabilities' },
          { id: 'title', k: 'title' },
        ],
      });

      expect(emitted).to.eql(['error', 'title']);
    });

    it('does not gate reorder on projection animation', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['title', 'error'];
      const reorder = toReorder(
        { animation: false, onFieldsChange: (e) => emitted = e.next },
        fields,
      );

      reorder?.onChange?.({
        next: [
          { id: 'error', k: 'error' },
          { id: 'title', k: 'title' },
        ],
      });

      expect(emitted).to.eql(['error', 'title']);
    });

    it('flattens recursive title groups back to visible field order', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['title', 'title.status', 'error'];
      const reorder = toReorder({ onFieldsChange: (e) => emitted = e.next }, fields);

      reorder?.onChange?.({
        next: [
          { id: 'error', k: 'error' },
          {
            id: 'group:title',
            kind: 'group',
            items: [
              { id: 'title', k: 'title' },
              {
                id: 'group:title.status',
                kind: 'group',
                items: [
                  { id: 'title.status', k: 'status' },
                  { id: 'title.status.label', k: 'label' },
                ],
              },
            ],
          },
          { id: 'capabilities', k: 'capabilities' },
        ],
      });

      expect(emitted).to.eql(['error', 'title', 'title.status']);
    });

    it('moves the body status row independently from the title group', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['title', 'status'];
      const reorder = toReorder({ onFieldsChange: (e) => emitted = e.next }, fields);

      reorder?.onChange?.({
        next: [
          { id: 'status', k: 'status' },
          {
            id: 'group:title',
            kind: 'group',
            items: [{ id: 'title', k: 'title' }],
          },
        ],
      });

      expect(emitted).to.eql(['status', 'title']);
    });

    it('ignores recursive reorder payloads with duplicate visible fields', () => {
      let emitted: Field[] | undefined;
      const fields: Field[] = ['title', 'error'];
      const reorder = toReorder({ onFieldsChange: (e) => emitted = e.next }, fields);

      reorder?.onChange?.({
        next: [
          {
            id: 'group:title',
            kind: 'group',
            items: [
              { id: 'title', k: 'title' },
              { id: 'title', k: 'title duplicate' },
            ],
          },
          { id: 'error', k: 'error' },
        ],
      });

      expect(emitted).to.eql(undefined);
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
