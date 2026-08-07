import { stripAnsi } from '@sys/cli/fmt';
import { describe, expect, it } from '../-test.ts';
import { HashFmt } from './mod.ts';

const HASH = `sha256-${'a'.repeat(59)}72fc9`;

describe('HashFmt.digest', () => {
  it('progressively elides digest context to fit its maximum width', () => {
    const digest = (maxWidth?: number) =>
      stripAnsi(HashFmt.digest(HASH, maxWidth === undefined ? {} : { maxWidth }));

    expect(digest()).to.eql('digest:sha256:#72fc9');
    expect(digest(20)).to.eql('digest:sha256:#72fc9');
    expect(digest(19)).to.eql('sha256:#72fc9');
    expect(digest(13)).to.eql('sha256:#72fc9');
    expect(digest(12)).to.eql('#72fc9');
    expect(digest(6)).to.eql('#72fc9');
    expect(digest(5)).to.eql('');
  });

  it('measures terminal cells rather than string code units', () => {
    const hash = `界-${'a'.repeat(59)}72fc9`;

    expect(stripAnsi(HashFmt.digest(hash, { maxWidth: 16 }))).to.eql('digest:界:#72fc9');
    expect(stripAnsi(HashFmt.digest(hash, { maxWidth: 15 }))).to.eql('界:#72fc9');
  });
});
