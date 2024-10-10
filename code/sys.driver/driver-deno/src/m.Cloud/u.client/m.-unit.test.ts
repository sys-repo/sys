import { describe, expect, it } from '../-test.ts';
import { DenoCloud } from './mod.ts';

describe('DenoCloud (client)', () => {
  it('has url', () => {
    const client = DenoCloud.client('https://foo.com');
    expect(client.url.toString()).to.eql('https://foo.com/');
    expect(client.url.join('/foobar')).to.eql('https://foo.com/foobar');
  });
});
