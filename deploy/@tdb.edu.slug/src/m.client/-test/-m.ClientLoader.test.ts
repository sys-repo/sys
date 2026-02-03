import { describe, expect, it } from '../../-test.ts';
import { ClientLoader } from '../mod.ts';

describe('ClientLoader.make', () => {
  it('returns a loader instance', () => {
    const origin = 'http://localhost:4040';
    const loader = ClientLoader.make({ origin: `${origin}//` });
    expect(loader.origin).to.eql({ app: origin, cdn: { default: origin, video: origin } });
  });
});
