import { describe, expect, it } from '../-test.ts';
import { Monaco, MonacoIs } from './mod.ts';

import { EditorCarets } from '../ui/m.Editor.Carets/mod.ts';
import { useBinding } from '../ui/m.Editor.Crdt/mod.ts';
import { MonacoEditor } from '../ui/ui.MonacoEditor/mod.ts';

describe('Monaco', () => {
  it('API', () => {
    expect(Monaco.Editor).to.equal(MonacoEditor);
    expect(Monaco.Carets).to.equal(EditorCarets);
    expect(Monaco.Is).to.equal(MonacoIs);
    expect(Monaco.useBinding).to.equal(useBinding);
  });
});
