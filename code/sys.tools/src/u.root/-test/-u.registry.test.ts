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

  it('derives import map and aliases map from registry', () => {
    for (const item of ROOT_REGISTRY) {
      expect(typeof Imports[item.id]).to.eql('function');
      const aliases = ALIAS[item.id] ?? [];
      expect(aliases).to.eql(item.aliases ?? []);
    }
  });
});
