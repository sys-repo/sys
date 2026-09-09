import { describe, expect, it } from '../../../-test.ts';
import { Fetch } from '../../m.Fetch/mod.ts';
import { Import } from '../../m.Import/mod.ts';
import { Is } from '../../m.Is/mod.ts';
import { Jsr } from '../mod.ts';

describe('Jsr (client)', () => {
  it('API', () => {
    expect(Jsr.Fetch).to.equal(Fetch);
    expect(Jsr.Is).to.equal(Is);
    expect(Jsr.Import).to.equal(Import);
    expect(Jsr.Url).to.equal(Fetch.Url);
    expect(Jsr.Url.Pkg.web('@sys/tools')).to.eql('https://jsr.io/@sys/tools');
  });
});
