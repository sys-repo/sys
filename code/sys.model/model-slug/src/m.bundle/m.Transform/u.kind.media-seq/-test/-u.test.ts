import { describe, expect, it } from '../../../../-test.ts';
import { AliasResolver } from '../common.ts';
import { resolveAliasPath } from '../u.path.alias.ts';

describe('u.path.alias', () => {
  it('hops through :index and normalizes resolved paths', () => {
    const local = AliasResolver.analyze(
      { alias: { ':index': 'crdt:index-root', ':core-videos': ':index/:assets/core' } },
      { alias: ['alias'] },
    ).resolver;
    const index = AliasResolver.analyze(
      { alias: { ':assets': '~/assets' } },
      { alias: ['alias'] },
    ).resolver;

    const res = resolveAliasPath('/:core-videos/example.webm', local, index);
    expect(res).to.exist;
    expect(res?.value).to.equal('~/assets/core/example.webm');
    expect(res?.remaining).to.eql([]);
  });
});
