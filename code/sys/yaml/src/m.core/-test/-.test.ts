import { describe, expect, it } from '../../-test.ts';

import { Diagnostic } from '../m.Diagnostic.ts';
import { EnvRef } from '../m.EnvRef.ts';
import { Error } from '../m.Error.ts';
import { YamlIs } from '../m.Is.ts';
import { Path } from '../m.Path.ts';
import { Range } from '../m.Range.ts';
import { Syncer } from '../m.Syncer.ts';
import { Yaml } from '../m.Yaml.ts';

describe('Yaml', () => {
  it('API', async () => {
    const { Yaml } = await import('@sys/yaml/core');

    expect(Yaml.Is).to.equal(YamlIs);
    expect(Yaml.Syncer).to.equal(Syncer);
    expect(Yaml.syncer).to.equal(Syncer.make);
    expect(Yaml.Path).to.equal(Path);
    expect(Yaml.path).to.equal(Path.make);
    expect(Yaml.Diagnostic).to.equal(Diagnostic);
    expect(Yaml.EnvRef).to.equal(EnvRef);
    expect(Yaml.Error).to.equal(Error);
  });

  it('freezes every namespace API', () => {
    for (
      const namespace of [
        Yaml,
        Yaml.Is,
        Yaml.Range,
        Yaml.Error,
        Yaml.Diagnostic,
        Yaml.EnvRef,
        Yaml.Syncer,
        Yaml.Path,
        YamlIs,
        Range,
        Error,
        Diagnostic,
        EnvRef,
        Syncer,
        Path,
      ]
    ) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
