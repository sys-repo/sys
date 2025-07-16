import { describe, expect, it } from '../-test.ts';
import { EditorCarets, EditorCrdt, EditorYaml, MonacoEditor } from '../ui/mod.ts';
import { Monaco, MonacoIs } from './mod.ts';

describe('Monaco', () => {
  it('API', () => {
    expect(Monaco.Editor).to.equal(MonacoEditor);
    expect(Monaco.Carets).to.equal(EditorCarets);
    expect(Monaco.Crdt).to.equal(EditorCrdt);
    expect(Monaco.Yaml).to.equal(EditorYaml);
    expect(Monaco.Is).to.equal(MonacoIs);
    expect(Monaco.useBinding).to.equal(EditorCrdt.useBinding);
  });
});
