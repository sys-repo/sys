import { describe, expect, it } from './mod.ts';
import { main } from '../entry.ts';

describe('sample.proxy', () => {
  it('exports the proxy app factory', () => {
    const proxy = main({ targetDir: './' });
    expect(proxy).to.be.ok;
    expect(proxy.fetch).to.be.a('function');
  });
});
