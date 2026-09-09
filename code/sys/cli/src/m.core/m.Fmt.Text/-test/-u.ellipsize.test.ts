import { c, describe, expect, it, Num, stripAnsi, type t } from '../../../-test.ts';
import {
  MAX_TERMINAL_CELLS,
  MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS,
  MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS,
} from '../../u/u.layout.ts';
import { ellipsize } from '../u/u.ellipsize.ts';
import { measure } from '../u.width/u.width.ts';

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
    expect(ellipsize('abcdef', Number.MAX_VALUE)).to.eql('');
    expect(ellipsize('abcdef', 1, { ellipsis: '界' })).to.eql('');
    expect(ellipsize('abcdef', 2, { ellipsis: '界' })).to.eql('界');
  });

  it('includes a custom ellipsis in the same cell budget', () => {
    expect(ellipsize('abcdefghij', 8, { ellipsis: '--' })).to.eql('abc--hij');
    expect(ellipsize('abcdefghij', 6, { ellipsis: '' })).to.eql('abchij');
  });

  it('renders clipped parts without sentinel strings', () => {
    let renders = 0;
    const render = (parts: t.CliFormatText.Ellipsize.Parts) => {
      renders += 1;
      return `${c.white(parts.head)}${c.gray(parts.ellipsis)}${c.white(parts.tail)}`;
    };
    const clipped = ellipsize('abcdefghij', 7, { render });

    expect(stripAnsi(clipped)).to.eql('abc…hij');
    expect(clipped).to.include(c.gray('…'));
    expect(measure(clipped)).to.eql(7);
    expect(renders).to.eql(1);

    const privateUseInput = ellipsize('ab\uE000cdefgh', 7, { render });
    expect(stripAnsi(privateUseInput)).to.eql('ab\uE000…fgh');
    expect(renders).to.eql(2);

    expect(ellipsize('abc', 3, { render })).to.eql('abc');
    expect(renders).to.eql(2);
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
          expect(measure(output) <= width).to.eql(true);
        }
      });
    });
  });

  it('retains internal overflow knowledge at the maximum clipping budget', () => {
    const input = '界'.repeat((MAX_TERMINAL_CELLS + 1) / 2);
    const output = ellipsize(input, MAX_TERMINAL_CELLS);

    expect(output).to.not.eql(input);
    expect(measure(output)).to.eql(MAX_TERMINAL_CELLS);
  });

  it('bounds aggregate source work, markers, and renderer output', () => {
    const marker = '\u200B'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - 2);
    const exact = ellipsize('ab', 1, { ellipsis: marker });
    expect(exact.length).to.eql(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - 1);

    let renders = 0;
    const markerFailure = failureOf(() =>
      ellipsize('ab', 1, {
        ellipsis: `${marker}\u200B`,
        render: () => {
          renders += 1;
          return '';
        },
      })
    );
    const sourceFailure = failureOf(() =>
      ellipsize('\u200B'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS + 1), 1)
    );
    const rendererFailure = failureOf(() =>
      ellipsize('abcdefghij', 3, {
        render: () => 'x'.repeat(MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS + 1),
      })
    );

    expect(renders).to.eql(0);
    for (const failure of [markerFailure, sourceFailure, rendererFailure]) {
      expect((failure as Error).message).to.eql(
        'Cli.Fmt.Text finite presentation limit exceeded.',
      );
      expect(failure).to.equal(markerFailure);
    }
    expect(Object.isFrozen(markerFailure)).to.eql(true);
  });
});

function failureOf(operation: () => unknown): unknown {
  try {
    operation();
  } catch (cause) {
    return cause;
  }
}
