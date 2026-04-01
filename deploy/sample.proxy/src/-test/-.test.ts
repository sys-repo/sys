import { describe, expect, it } from './mod.ts';
import { proxy } from '../mod.ts';

describe('sample.proxy', () => {
  it('exports the proxy instance', () => {
    expect(proxy).to.be.ok;
    expect(proxy.fetch).to.be.a('function');
  });
});
