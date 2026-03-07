import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import type { t } from '../common.ts';

describe('tool: Crypto', () => {
  it('exposes canonical tool metadata', () => {
    type Id = t.CryptoTool.Id;
    type Name = t.CryptoTool.Name;

    const id: Id = D.tool.id;
    const name: Name = D.tool.name;

    expect(id).to.eql('crypto');
    expect(name).to.eql('system/crypto:tools');
  });
});
