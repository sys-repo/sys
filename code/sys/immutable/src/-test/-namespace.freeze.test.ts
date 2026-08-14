import { describe, expect, it } from '../-test.ts';
import { Graph } from '../m.graph/mod.ts';
import { Is, markProxy, Symbols } from '../m.core/m.Immutable/mod.ts';
import { Lens } from '../m.core/m.Immutable.Lens/mod.ts';
import { PathRef } from '../m.core/m.PathRef/mod.ts';
import { Immutable } from '../m.rfc6902/mod.ts';
import { Url } from '../m.url/mod.ts';

describe('immutable namespace freeze contract', () => {
  it('freezes every exported namespace API and nested namespace', () => {
    const namespaces = [
      Is,
      Symbols,
      Symbols.map,
      markProxy,
      Lens,
      PathRef,
      Immutable,
      Immutable.Events,
      Immutable.Patch,
      Graph,
      Graph.default,
      Graph.Dag,
      Url,
    ];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);

    expect(Immutable.Is).to.equal(Is);
    expect(Immutable.Lens).to.equal(Lens);
  });
});
