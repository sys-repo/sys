import { describe, expect, it, type t } from '../../../../-test.ts';
import { insertDividerAfterCursor, isDividerInsertionKeyboardEvent } from '../u.divider.ts';
import { resolveItems } from '../u.fields.ts';

type ConfigItem = t.Files.InfoPanel.Config.Item;
type KeyboardEventLike = Parameters<typeof isDividerInsertionKeyboardEvent>[0];

const target = (...path: string[]): t.KeyValue.Cursor.Target => ({ path });

describe('Files.InfoPanel.Config: divider insertion', () => {
  it('inserts a divider after the current visible field target', () => {
    const items: ConfigItem[] = ['error', 'events'];

    expect(insertDividerAfterCursor({ items, current: target('error') })).to.eql([
      'error',
      { kind: 'divider', id: 'divider:1' },
      'events',
    ]);
  });

  it('inserts after a current divider and skips used divider IDs', () => {
    const items: ConfigItem[] = [
      'error',
      { kind: 'divider', id: 'divider:1' },
      'events',
    ];

    expect(insertDividerAfterCursor({ items, current: target('divider:1') })).to.eql([
      'error',
      { kind: 'divider', id: 'divider:1' },
      { kind: 'divider', id: 'divider:2' },
      'events',
    ]);
  });

  it('inserts after the nested title atom rather than inside title internals', () => {
    const items = resolveItems([
      'events',
      'title',
      { kind: 'divider', id: 'divider:1' },
      'title.status',
      'error',
    ], undefined);
    const expected: ConfigItem[] = [
      'events',
      'title',
      'title.status',
      { kind: 'divider', id: 'divider:2' },
      { kind: 'divider', id: 'divider:1' },
      'error',
    ];

    expect(
      insertDividerAfterCursor({
        items,
        current: target('group:title', 'group:title.status', 'title.status.label'),
      }),
    ).to.eql(expected);
    expect(insertDividerAfterCursor({ items, current: target('title') })).to.eql(expected);
  });

  it('does not insert for missing, hidden, or empty cursor targets', () => {
    const items: ConfigItem[] = ['events'];

    expect(insertDividerAfterCursor({ items })).to.eql(undefined);
    expect(insertDividerAfterCursor({ items, current: target('status') })).to.eql(undefined);
    expect(insertDividerAfterCursor({ items, current: target('group:title') })).to.eql(undefined);
  });

  it('accepts only uncommanded Option/Alt+Enter', () => {
    expect(isDividerInsertionKeyboardEvent(keyboard({ altKey: true }))).to.eql(true);
    expect(isDividerInsertionKeyboardEvent(keyboard({ altKey: false }))).to.eql(false);
    expect(isDividerInsertionKeyboardEvent(keyboard({ altKey: true, key: 'ArrowDown' }))).to.eql(
      false,
    );
    expect(isDividerInsertionKeyboardEvent(keyboard({ altKey: true, shiftKey: true }))).to.eql(
      false,
    );
    expect(isDividerInsertionKeyboardEvent(keyboard({ altKey: true, ctrlKey: true }))).to.eql(
      false,
    );
    expect(isDividerInsertionKeyboardEvent(keyboard({ altKey: true, metaKey: true }))).to.eql(
      false,
    );
    expect(isDividerInsertionKeyboardEvent(keyboard({ altKey: true, defaultPrevented: true }))).to
      .eql(false);
  });
});

function keyboard(init: Partial<KeyboardEventLike> = {}): KeyboardEventLike {
  return {
    altKey: false,
    ctrlKey: false,
    defaultPrevented: false,
    key: 'Enter',
    metaKey: false,
    shiftKey: false,
    target: null,
    ...init,
  };
}
