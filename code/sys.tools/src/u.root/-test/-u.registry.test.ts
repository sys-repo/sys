import { describe, expect, it } from '../../-test.ts';
import { ALIAS, Imports, ROOT_REGISTRY, TOOL_IDS } from '../registry.ts';

describe('Root Registry', () => {
  it('has unique tool ids', () => {
    const ids = ROOT_REGISTRY.map((item) => item.id);
    expect(new Set(ids).size).to.eql(ids.length);
    expect(TOOL_IDS).to.eql(ids);
  });

  it('has unique aliases across tools', () => {
    const aliases = ROOT_REGISTRY.flatMap((item) => item.aliases ?? []);
    expect(new Set(aliases).size).to.eql(aliases.length);
  });

  it('surfaces shell as a secondary root tool without aliases', () => {
    const shell = ROOT_REGISTRY.find((item) => item.id === 'shell');
    expect(shell?.id).to.eql('shell');
    expect(shell?.aliases).to.eql(undefined);
    expect(shell?.group).to.eql('secondary');
    expect(typeof shell?.load).to.eql('function');
  });

  it('derives import map and aliases map from registry', () => {
    for (const item of ROOT_REGISTRY) {
      expect(Imports[item.id]).to.equal(item.load);
      const aliases = ALIAS[item.id] ?? [];
      expect(aliases).to.eql(item.aliases ?? []);
    }
  });
});
