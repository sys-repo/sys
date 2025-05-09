import { describe, expect, it } from '../-test.ts';
import { Monaco } from './mod.ts';

import { EditorCarets } from '../ui/u.Editor.Carets/mod.ts';
import { MonacoEditor } from '../ui/ui.MonacoEditor/mod.ts';

describe('Monaco', () => {
  it('API', () => {
    expect(Monaco.Editor).to.equal(MonacoEditor);
    expect(Monaco.Carets).to.equal(EditorCarets);
  });
});
