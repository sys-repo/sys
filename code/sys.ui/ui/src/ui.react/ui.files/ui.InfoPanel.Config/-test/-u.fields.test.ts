import { describe, expect, it } from '../../../../-test.ts';
import { D, type t } from '../common.ts';
import { resolveFields, toggleField, toItemFields } from '../u.fields.ts';
import { toSwitchItems } from '../u.items.tsx';
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
  });
});

/**
 * Helpers:
 */
function switchRowById(items: t.KeyValue.Switches.Item[], id: Field): Row {
  const row = items.find((item): item is Row => 'id' in item && item.id === id);
  if (!row) throw new Error(`Missing switch row: ${id}`);
  return row;
}
