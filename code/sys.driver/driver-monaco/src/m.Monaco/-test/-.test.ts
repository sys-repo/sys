import { describe, expect, it } from '../../-test.ts';
import { EditorCrdt, EditorYaml, MonacoEditor, YamlEditor } from '../../ui/mod.ts';

import { Bus } from '../../m.events/mod.ts';
import { Link } from '../m.Link.ts';
import { Monaco, MonacoIs } from '../mod.ts';

describe('Monaco', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco');
    const { Error } = await import('../m.Error.ts');
    expect(m.Monaco).to.equal(Monaco);

    expect(Monaco.Bus).to.equal(Bus);
    expect(Monaco.Editor).to.equal(MonacoEditor);
    expect(Monaco.Crdt).to.equal(EditorCrdt);
    expect(Monaco.Yaml).to.equal(EditorYaml);
    expect(Monaco.Yaml.Editor).to.equal(YamlEditor);
    expect(Monaco.Is).to.equal(MonacoIs);
    expect(Monaco.Link).to.equal(Link);
    expect(Monaco.Error).to.equal(Error);
  });
});
