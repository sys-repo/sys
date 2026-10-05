import { describe, expect, it } from '../-test.ts';
import { Esm } from '../m.core/mod.ts';
import { Deps } from '../m.deps/mod.ts';
import { EsmAssert } from '../m.testing/mod.ts';
import { Latest } from '../m.core/m.Esm/u.latest.ts';
import { wrangle as PolicyWrangle } from '../m.core/m.Policy/u.wrangle.ts';
import { wrangle as TopologicalWrangle } from '../m.core/m.Topological/u.wrangle.ts';
import { PackageJsonPolicy } from '../m.deps/u.packageJson.policy.ts';

describe('esm namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      Esm,
      Esm.Topological,
      Esm.Policy,
      Esm.Modules,
      Esm.Is,
      Deps,
      EsmAssert,
      Latest,
      PolicyWrangle,
      TopologicalWrangle,
      PackageJsonPolicy,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
