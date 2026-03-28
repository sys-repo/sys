import { type t, describe, expect, it } from '../../../-test.ts';
import { Color } from '../../mod.ts';

describe('Color.toGrayAlpha', () => {
  const test = (value: number, output: string) => {
    expect(Color.toGrayAlpha(value)).to.eql(output);
  };

  it('converts number to RGBA', () => {
    test(0, 'rgba(0, 0, 0, 0.0)');
    test(1, 'rgba(255, 255, 255, 1)');
    test(0.5, 'rgba(255, 255, 255, 0.5)');
    test(-1, 'rgba(0, 0, 0, 1)');
    test(-0.5, 'rgba(0, 0, 0, 0.5)');
  });
});

describe('Color.alpha', () => {
  it('DARK', () => {
    const res = Color.alpha(Color.DARK, 0.3);
    expect(res).to.eql('rgba(41, 48, 66, 0.3)');
  });

  it('hex only contract', () => {
    const res1 = Color.alpha(Color.WHITE, 0.5);
    const res2 = Color.alpha('#fff', 0.5);
    expect(res1).to.eql('rgba(255, 255, 255, 0.5)');
    expect(res2).to.eql('rgba(255, 255, 255, 0.5)');
  });

  it('rejects named colors', () => {
    expect(() => Color.alpha('white' as any, 0.5)).to.throw(
      'Color.alpha expects a hex/rgb/rgba color.',
    );
  });
});

describe('Color.ruby', () => {
  it('percentage of red', () => {
    const res1 = Color.ruby(1);
    const res2 = Color.ruby(0);
    const res3 = Color.ruby(0.1);
    const res4 = Color.ruby();

    expect(res1).to.eql(Color.alpha(Color.RED, 1));
    expect(res2).to.eql(Color.alpha(Color.RED, 0));
    expect(res3).to.eql(Color.alpha(Color.RED, 0.1));
    expect(res3).to.eql(res4);
  });

  it('boolean parameter (eg. debug flag)', () => {
    const res1 = Color.ruby(true);
    const res2 = Color.ruby(false);
    expect(res1).to.eql(Color.alpha(Color.RED, 0.1));
    expect(res2).to.eql(Color.alpha(Color.RED, 0));
  });
});

describe('Color.lighten | Color.darken', () => {
  it('lighten', () => {
    const a = Color.lighten(Color.DARK, 10);
    const b = Color.lighten(Color.WHITE, 10);
    expect(a).to.eql('rgb(61, 71, 97)');
    expect(b).to.eql('rgb(255, 255, 255)');
  });

  it('darken', () => {
    const a = Color.darken(Color.WHITE, 10);
    const b = Color.darken(Color.BLACK, 10);
    expect(a).to.eql('rgb(230, 230, 230)');
    expect(b).to.eql('rgb(0, 0, 0)');
  });
});

describe('Color.toHex', () => {
  const test = (input: string, expected?: string) => {
    const res = Color.toHex(input as t.AlphaColorInput);
    expect(res).to.eql(expected);
  };

  it('converts rgb/rgba to hex', () => {
    test('rgb(255, 0, 0)', '#ff0000');
    test('rgba(255, 0, 0, 1)', '#ff0000');
    test('rgba(255, 0, 0, 0.5)', '#ff0000');
  });

  it('handles hex input', () => {
    test('#00ff00', '#00ff00');
    test('#fff', '#ffffff');
  });

  it('returns undefined for invalid input', () => {
    test('white', undefined);
    test('not-a-color', undefined);
    test('', undefined);
  });
});
