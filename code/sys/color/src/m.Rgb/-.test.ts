import { describe, expect, it } from '../-test.ts';
import { Color, Theme } from './mod.ts';

describe('Color', () => {
  it('API', () => {
    expect(Color.Theme).to.equal(Theme);
  });

  describe('Color.format', () => {
    const test = (value: string | number | boolean | undefined, output?: string) => {
      expect(Color.format(value)).to.eql(output);
    };

    it('converts number to RGBA', () => {
      test(0, 'rgba(0, 0, 0, 0.0)');
      test(1, 'rgba(255, 255, 255, 1)');
      test(0.5, 'rgba(255, 255, 255, 0.5)');
      test(-1, 'rgba(0, 0, 0, 1)');
      test(-0.5, 'rgba(0, 0, 0, 0.5)');
    });

    it('converts TRUE to RED (ruby)', () => {
      test(true, Color.RUBY);
    });

    it('undefined', () => {
      test(undefined, undefined);
    });

    it('string: RGB value', () => {
      const rgb = 'rgb(0, 245, 35)';
      test(rgb, rgb);
    });

    it('string: RGBA value', () => {
      const rgb = 'rgba(0, 245, 35, 0.7)';
      test(rgb, rgb);
    });

    it('string: hex value', () => {
      const hex = '#fff';
      test(hex, hex);
    });

    it('string: hex value with no hash', () => {
      test('fff', '#fff');
    });

    it('string: does not convert "url(...)"', () => {
      const value = `url(my-image.png)`;
      test(value, value);
    });
  });

  describe('Color.alpha', () => {
    it('DARK', () => {
      const res = Color.alpha(Color.DARK, 0.3);
      expect(res).to.eql('rgba(41, 48, 66, 0.3)');
    });

    it('WHITE', () => {
      const res1 = Color.alpha(Color.WHITE, 0.5);
      const res2 = Color.alpha('white', 0.5);
      const res3 = Color.alpha('#fff', 0.5);
      expect(res1).to.eql('rgba(255, 255, 255, 0.5)');
      expect(res2).to.eql('rgba(255, 255, 255, 0.5)');
      expect(res3).to.eql('rgba(255, 255, 255, 0.5)');
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

  describe('Color.theme', () => {
    it('create from root API', () => {
      const a = Color.Theme.create();
      const b = Color.theme();
      expect(a.name).to.eql(b.name);
    });

    it('create: from {theme} object', () => {
      const theme = Color.theme();
      expect(Color.theme(undefined).name).to.eql('Light');
      expect(Color.theme(null).name).to.eql('Light');
      expect(Color.theme(theme)).to.equal(theme);
      expect(Color.theme('Light').name).to.eql('Light');
      expect(Color.theme('Dark').name).to.eql('Dark');
    });

    it('toString', () => {
      const a = Color.theme();
      const b = Color.theme('Dark');
      expect(a.toString()).to.eql('Light');
      expect(b.toString()).to.eql('Dark');
    });

    it('toColors', () => {
      const theme = Color.theme();
      const { fg, bg } = theme;
      expect(theme.toColors()).to.eql({ fg, bg });
    });

    describe('name', () => {
      it('name: Light (default)', () => {
        const res1 = Color.theme();
        const res2 = Color.theme('Light');
        const res3 = Color.theme('Light', 'red', 'salmon');
        expect(res1.toString()).to.eql(res1.name);
        expect(res1.is.light).to.eql(true);
        expect(res1.is.dark).to.eql(false);
        expect(res1.fg).to.eql(Color.DARK);
        expect(res1.bg).to.eql(Color.WHITE);
        expect(res2.fg).to.eql(Color.DARK);
        expect(res2.bg).to.eql(Color.WHITE);
        expect(res3.fg).to.eql('red');
        expect(res3.bg).to.eql('salmon');
      });

      it('name: Dark', () => {
        const res1 = Color.theme('Dark');
        const res2 = Color.theme('Dark', null, 'red');
        expect(res1.name).to.eql('Dark');
        expect(res1.is.light).to.eql(false);
        expect(res1.is.dark).to.eql(true);
        expect(res1.fg).to.eql(Color.WHITE);
        expect(res2.fg).to.eql('red');
        expect(res1.bg).to.eql(Color.DARK);
        expect(res2.bg).to.eql(Color.DARK);
      });
    });

    describe('alpha', () => {
      it('alpha.fg (foreground)', () => {
        const light = Color.theme();
        const dark = Color.theme('Dark');

        const a = light.alpha().fg; // NB: default → 1.
        const b = light.alpha(0.5).fg;
        const c = dark.alpha(0.3).fg;

        expect(a).to.eql('rgb(41, 48, 66)');
        expect(b).to.eql('rgba(41, 48, 66, 0.5)');
        expect(c).to.eql('rgba(255, 255, 255, 0.3)');
      });

      it('alpha.bg (background)', () => {
        const light = Color.theme();
        const dark = Color.theme('Dark');

        const a = light.alpha().bg;
        const b = light.alpha(0.5).bg;
        const c = dark.alpha(0.3).bg;

        expect(a).to.eql('rgb(255, 255, 255)');
        expect(b).to.eql('rgba(255, 255, 255, 0.5)');
        expect(c).to.eql('rgba(41, 48, 66, 0.3)');
      });

      it('alpha: negative → invert theme', () => {
        const theme = Color.theme();
        const a = theme.alpha(-0.1);
        const b = theme.alpha(-99);

        expect(a.fg).to.eql(theme.invert().alpha(0.1).fg);
        expect(a.bg).to.eql(theme.invert().alpha(0.1).bg);

        expect(b.fg).to.eql(theme.invert().alpha(1).fg);
        expect(b.bg).to.eql(theme.invert().alpha(1).bg);
      });
    });

    describe('format', () => {
      it('input: undefined', () => {
        const theme = Color.theme();
        const a = theme.format();
        const b = theme.format(null as any);
        const c = theme.format('');
        expect(a).to.eql(theme.toColors());
        expect(b).to.eql(theme.toColors());
        expect(c).to.eql(theme.toColors());
      });

      it('input: percent', () => {
        const theme = Color.theme();
        expect(theme.format(0.3)).to.eql(theme.alpha(0.3));
        expect(theme.format(2)).to.eql(theme.alpha(1)); // NB: clamped 0..1
        expect(theme.format(0)).to.eql(theme.alpha(0));
        expect(theme.format(-0.15)).to.eql(theme.alpha(-0.15));
      });

      it('input: string (color)', () => {
        const theme = Color.theme();
        const test = (color: string) => {
          const res = theme.format(color);
          expect(res).to.eql({ fg: color, bg: color });
        };
        test('red');
        test('#000');
      });
    });

    describe('invert', () => {
      it('invert', () => {
        const light = Color.theme();
        const dark = Color.theme('Dark');

        expect(light.invert().name).to.eql('Dark');
        expect(dark.invert().name).to.eql('Light');

        expect(light.invert()).to.not.equal(light); // NB: monad.
      });

      it('Theme.invert (static method)', () => {
        const a = Color.theme();
        expect(a.toString()).to.eql('Light');

        const b = Theme.invert(a.name);
        expect(b).to.eql('Dark');
        expect(Theme.invert()).to.eql('Dark');
      });

      it('invert: custom colors', () => {
        const theme = Color.theme('Light', 'red', 'salmon');
        const inverted = theme.invert();

        expect(theme.fg).to.eql('red');
        expect(theme.bg).to.eql('salmon');

        expect(inverted.fg).to.eql('salmon');
        expect(inverted.bg).to.eql('red');
      });
    });
  });

  describe('Color.lighten | Color.darkwn', () => {
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
      const res = Color.toHex(input);
      expect(res).to.eql(expected);
    };

    it('converts named colors to hex', () => {
      test('white', '#ffffff');
      test('black', '#000000');
      test('red', '#ff0000');
    });

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
      test('not-a-color', undefined);
      test('', undefined);
    });
  });
});
