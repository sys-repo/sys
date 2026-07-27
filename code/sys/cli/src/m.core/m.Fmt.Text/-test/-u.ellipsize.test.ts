import { describe, expect, it, Num } from '../../../-test.ts';
import { ellipsize } from '../u.ellipsize.ts';
import { visibleWidth } from '../u.width.ts';

describe('Cli.Fmt.Text.ellipsize', () => {
  it('preserves fitting text and balanced ASCII middle-ellipsis behavior', () => {
    expect(ellipsize('', 5)).to.eql('');
    expect(ellipsize('abc', 3)).to.eql('abc');
    expect(ellipsize('abcdefghij', 7)).to.eql('abc…hij');
    expect(ellipsize('abcdefghij', 6)).to.eql('abc…ij');
  });

  it('allocates the budget in terminal cells', () => {
    expect(ellipsize('甲乙丙丁戊', 7)).to.eql('甲乙…戊');
    expect(ellipsize('A👨‍👩‍👧‍👦B界C', 5)).to.eql('A👨‍👩‍👧‍👦…C');
  });

  it('never splits grapheme clusters', () => {
    expect(ellipsize('e\u0301e\u0301e\u0301e\u0301e\u0301', 4)).to.eql(
      'e\u0301e\u0301…e\u0301',
    );
    expect(ellipsize('🇳🇿🇦🇺🇨🇦', 5)).to.eql('🇳🇿…🇨🇦');
    expect(ellipsize('👍🏽👍🏾👍🏿', 5)).to.eql('👍🏽…👍🏿');
    expect(ellipsize('1️⃣2️⃣3️⃣', 5)).to.eql('1️⃣…3️⃣');
    expect(ellipsize('𝌆𝌆𝌆', 3)).to.eql('𝌆…');
    expect(ellipsize('👨‍👩‍👧‍👦👩‍👩‍👦‍👦👨‍👨‍👧‍👧', 5)).to.eql('👨‍👩‍👧‍👦…👨‍👨‍👧‍👧');
  });

  it('normalizes invalid and sub-ellipsis budgets without overflow', () => {
    expect(ellipsize('abcdef', 0)).to.eql('');
    expect(ellipsize('\u0301', 0)).to.eql('');
    expect(ellipsize('abcdef', -1)).to.eql('');
    expect(ellipsize('abcdef', Num.INFINITY)).to.eql('');
    expect(ellipsize('abcdef', 1, { ellipsis: '界' })).to.eql('');
    expect(ellipsize('abcdef', 2, { ellipsis: '界' })).to.eql('界');
  });

  it('includes a custom ellipsis in the same cell budget', () => {
    expect(ellipsize('abcdefghij', 8, { ellipsis: '--' })).to.eql('abc--hij');
    expect(ellipsize('abcdefghij', 6, { ellipsis: '' })).to.eql('abchij');
    expect(ellipsize('abcdefghij', 7, { ellipsis: '\uE000' })).to.eql('abc\uE000hij');
  });

  it('never emits text wider than the requested cell budget', () => {
    const inputs = [
      'abcdefghij',
      '甲乙丙丁戊',
      'e\u0301e\u0301e\u0301e\u0301e\u0301',
      '👨‍👩‍👧‍👦🇳🇿👍🏽1️⃣界',
    ];

    const markers = ['…', '--', '界', ''];
    inputs.forEach((input) => {
      markers.forEach((ellipsis) => {
        for (let width = 0; width <= 10; width++) {
          const output = ellipsize(input, width, { ellipsis });
          expect(visibleWidth(output) <= width).to.eql(true);
        }
      });
    });
  });
});
