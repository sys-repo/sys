import { describe, expect, it } from '../-test.ts';
import { Url } from './mod.ts';

describe('Jsr.Fetch.Url', () => {
  it('origin (url)', () => {
    expect(Url.origin).to.eql('https://jsr.io');
  });

  it('Url.Pkg.metadata', () => {
    const url = Url.Pkg.metadata('@sys/std');
    expect(url).to.eql('https://jsr.io/@sys/std/meta.json');
  });

  it('Url.Pkg.version', () => {
    const url = Url.Pkg.version('@sys/std', '0.0.42');
    expect(url).to.eql('https://jsr.io/@sys/std/0.0.42_meta.json');
  });
});
