import { describe, expect, it, Time } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { Tmpl } from './mod.ts';

describe('Tmpl', () => {
  it('init: paths', async () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.source);
    expect(tmpl.source.dir).to.eql(test.source);
    expect(await tmpl.source.ls()).to.eql(await test.ls.source());
  });

  describe('copy', () => {
    it('copies all source files', async () => {
      const test = SAMPLE.init();
      const tmpl = Tmpl.create(test.source);
      expect(await test.ls.target()).to.eql([]);
      const res = await tmpl.copy(test.target);
      expect(res.source.dir).to.eql(test.source);
      expect(await res.target.ls()).to.eql(await test.ls.target());
    });

    it('fn (param): exclude', async () => {
      const { source, target } = SAMPLE.init();
      const tmpl = Tmpl.create(source, async (e) => {
        await Time.wait(0); // NB: ensure the async variant of the function waits for completion.
        if (e.file.name.endsWith('.md')) e.exclude('user-space');
      });

      const res = await tmpl.copy(target);

      for (const op of res.operations) {
        if (op.file.name.endsWith('.md')) {
          expect(op?.action).to.eql('Unchanged');
          expect(op?.excluded).to.eql('user-space');
        } else {
          expect(op.excluded).to.eql(undefined);
        }
      }
    });
  });
});
