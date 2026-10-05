import { describe, expect, it } from '../-test.ts';
import { TextBlock } from '../m.block/mod.ts';
import { Diff } from '../m.diff/mod.ts';
import { Filter } from '../m.filter/mod.ts';
import { Token } from '../m.gpt/mod.ts';
import { TextUpdate } from '../m.update/mod.ts';

describe('text namespace freeze contract', () => {
  it('freezes every exported namespace API', () => {
    const namespaces = [Diff, TextUpdate, Filter, TextBlock, Token];
    for (const namespace of namespaces) expect(Object.isFrozen(namespace)).to.eql(true);
  });
});
