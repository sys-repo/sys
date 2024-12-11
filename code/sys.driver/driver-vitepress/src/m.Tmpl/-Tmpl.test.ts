import { describe, expect, it, Time } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { Tmpl } from './mod.ts';

describe('Tmpl', () => {
  it('init: paths', async () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.source, test.target);
    expect(tmpl.source.dir).to.eql(test.source);
    expect(tmpl.target.dir).to.eql(test.target);
    expect(await tmpl.source.ls()).to.eql(await test.ls.source());
    expect(await tmpl.target.ls()).to.eql([]);
  });

  describe('copy', () => {
    it('copies all source files', async () => {
      const test = SAMPLE.init();
      const tmpl = Tmpl.create(test.source, test.target);
      expect(await tmpl.target.ls()).to.eql([]);
      await tmpl.copy();
      expect(await tmpl.target.ls()).to.eql(await test.ls.target());
    });

    it('fn (param): exclude', async () => {
      const { source, target } = SAMPLE.init();
      const tmpl = Tmpl.create(source, target, async (e) => {
        await Time.wait(0); // NB: ensure the async variant of the function waits for completion.
        if (e.file.name.endsWith('.md')) e.exclude('user-space');
      });

      const res = await tmpl.copy();

      for (const op of res.operations) {
        if (op.file.name.endsWith('.md')) {
          expect(op?.kind).to.eql('Unchanged');
          expect(op?.excluded).to.eql('user-space');
        } else {
          expect(op.excluded).to.eql(undefined);
        }
      }
    });
  });
});
