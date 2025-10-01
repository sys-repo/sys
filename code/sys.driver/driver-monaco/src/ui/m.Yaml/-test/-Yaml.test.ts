import { describe, expect, it } from '../../../-test.ts';
import { EditorYaml } from '../mod.ts';

describe('Monaco.Yaml', () => {
  it('API', async () => {
    const m = await import('@sys/driver-monaco');
    expect(m.Monaco.Yaml).to.eql(EditorYaml);
    expect(m.Monaco.Yaml.Path.observe).to.equal(EditorYaml.Path.observe);
  });
});
