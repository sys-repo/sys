import { describe, expect, it } from '../../../-test.ts';
import { Fmt } from '../../mod.ts';
import { Text } from '../mod.ts';
import { fitWidth, maxVisibleWidth, padEnd, visibleWidth } from '../u.width.ts';
import { wrap, wrapLines } from '../u.wrap.ts';

describe('Cli.Fmt.Text', () => {
  describe('API', () => {
    it('is exported through the CLI formatter surface', async () => {
      const m = await import('@sys/cli/fmt');

      expect(Text).to.equal(Fmt.Text);
      expect(m.Text).to.equal(Text);
      expect(m.Fmt.Text).to.equal(Text);
    });

    it('assembles the public formatter from focused width and wrap helpers', () => {
      expect(Text.visibleWidth).to.equal(visibleWidth);
      expect(Text.padEnd).to.equal(padEnd);
      expect(Text.maxVisibleWidth).to.equal(maxVisibleWidth);
      expect(Text.fitWidth).to.equal(fitWidth);
      expect(Text.wrap).to.equal(wrap);
      expect(Text.wrapLines).to.equal(wrapLines);
    });
  });
});
