import { describe, expect, it } from '../../-test.ts';

import { Diagnostic } from '../m.Diagnostic.ts';
import { Error } from '../m.Error.ts';
import { YamlIs } from '../m.Is.ts';
import { Path } from '../m.Path.ts';
import { Syncer } from '../m.Syncer.ts';

describe('Yaml', () => {
  it('API', async () => {
    const { Yaml } = await import('@sys/yaml/core');

    expect(Yaml.Is).to.equal(YamlIs);
    expect(Yaml.Syncer).to.equal(Syncer);
    expect(Yaml.syncer).to.equal(Syncer.make);
    expect(Yaml.Path).to.equal(Path);
    expect(Yaml.path).to.equal(Path.make);
    expect(Yaml.Diagnostic).to.equal(Diagnostic);
    expect(Yaml.Error).to.equal(Error);
  });
});
