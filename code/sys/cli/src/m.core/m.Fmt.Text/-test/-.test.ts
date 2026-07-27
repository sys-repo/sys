import { describe, expect, it } from '../../../-test.ts';
import { Fmt } from '../../mod.ts';
import { Text } from '../mod.ts';
import { ellipsize } from '../u.ellipsize.ts';
import { fit, max, measure, padEnd } from '../u.width.ts';
import { lines, text } from '../u.wrap.ts';

describe('Cli.Fmt.Text', () => {
  describe('API', () => {
    it('is exported through the CLI formatter surface', async () => {
      const m = await import('@sys/cli/fmt');

      expect(Text).to.equal(Fmt.Text);
      expect(m.Text).to.equal(Text);
      expect(m.Fmt.Text).to.equal(Text);
    });

    it('assembles exact width and wrap namespaces from their focused helpers', () => {
      expect(Reflect.ownKeys(Text)).to.eql(['Width', 'Wrap', 'ellipsize']);
      expect(Reflect.ownKeys(Text.Width)).to.eql(['measure', 'padEnd', 'max', 'fit']);
      expect(Reflect.ownKeys(Text.Wrap)).to.eql(['text', 'lines']);

      expect(Text.Width.measure).to.equal(measure);
      expect(Text.Width.padEnd).to.equal(padEnd);
      expect(Text.Width.max).to.equal(max);
      expect(Text.Width.fit).to.equal(fit);
      expect(Text.Wrap.text).to.equal(text);
      expect(Text.Wrap.lines).to.equal(lines);
      expect(Text.ellipsize).to.equal(ellipsize);
    });
  });
});
