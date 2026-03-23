import { describe, expect, it } from '../../-test.ts';
import { Npm } from '../mod.ts';
import { Fetch } from './mod.ts';

describe('Npm.Fetch', () => {
  it('API', () => {
    expect(Npm.Fetch).to.equal(Fetch);
    expect(Npm.Url).to.equal(Fetch.Url);
  });

  it('Url.Pkg helpers', () => {
    expect(Fetch.Url.Pkg.metadata('react')).to.eql('https://registry.npmjs.org/react');
    expect(Fetch.Url.Pkg.metadata('@scope/foo')).to.eql('https://registry.npmjs.org/@scope%2Ffoo');
    expect(Fetch.Url.Pkg.version('react', '19.0.0')).to.eql('https://registry.npmjs.org/react/19.0.0');
    expect(Fetch.Url.Pkg.version('@scope/foo', '1.2.3')).to.eql(
      'https://registry.npmjs.org/@scope%2Ffoo/1.2.3',
    );
  });
});
