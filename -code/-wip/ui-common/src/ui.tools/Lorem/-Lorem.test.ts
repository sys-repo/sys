import { expect, describe, it } from '../../-test.ts';

import { LOREM, Lorem } from './mod.ts';

describe('lorem (ipsum...)', () => {
  it('LOREM (constant)', () => {
    expect(LOREM.startsWith('Lorem ipsum dolor sit amet,')).to.eql(true);
    expect(LOREM.endsWith('Integer lacinia sapien at ante tempus volutpat.')).to.eql(true);
  });

  it('toString', () => {
    expect(Lorem.toString()).to.equal(LOREM);
  });

  it('text', () => {
    expect(Lorem.text).to.equal(LOREM);
  });

  it('words', () => {
    expect(Lorem.words()).to.eql(LOREM);

    expect(Lorem.words(-1)).to.eql('');
    expect(Lorem.words(0)).to.eql('');

    expect(Lorem.words(-1)).to.eql('', '.');
    expect(Lorem.words(0)).to.eql('', '.');

    expect(Lorem.words(1)).to.eql('Lorem');
    expect(Lorem.words(5)).to.eql('Lorem ipsum dolor sit amet'); // NB: no trailing comma.
    expect(Lorem.words(8)).to.eql('Lorem ipsum dolor sit amet, consectetur adipiscing elit'); // NB: no trailing period.

    expect(Lorem.words(1, '.')).to.eql('Lorem.');
    expect(Lorem.words(5, '.')).to.eql('Lorem ipsum dolor sit amet.');
    expect(Lorem.words(8, '.')).to.eql('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
  });
});
