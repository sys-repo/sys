import { describe, expect, it } from '../../../../-test.ts';
import { D } from '../common.ts';
import { resolveTemplate } from '../u.template.ts';

describe('u.template', () => {
  it('applies templates', () => {
    expect(resolveTemplate(D.assetsTemplate, 'crdt:abc123')).to.equal('slug.abc123.assets.json');
    expect(resolveTemplate('plain.json', 'abc')).to.equal('plain.json');
  });
});
