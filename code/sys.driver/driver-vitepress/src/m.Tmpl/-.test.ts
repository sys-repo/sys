import { Fs, describe, expect, it, Time } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { Tmpl } from './mod.ts';

describe('Tmpl', () => {
  it('init: paths', async () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.source);
    expect(tmpl.source.dir).to.eql(test.source);
    expect(await tmpl.source.ls()).to.eql(await test.ls.source());
  });

  describe('tmpl.copy (method)', () => {
    it('copies all source files', async () => {
      const test = SAMPLE.init();
      const tmpl = Tmpl.create(test.source);
      expect(await test.ls.target()).to.eql([]);

      const res = await tmpl.copy(test.target);

      expect(res.source.dir).to.eql(test.source);
      expect(await res.target.ls()).to.eql(await test.ls.target());
      expect(res.operations.every((m) => m.excluded === undefined)).to.eql(true);
    });

    it('fn (param): exclude', async () => {
      const { source, target } = SAMPLE.init();
      const tmpl = Tmpl.create(source, async (e) => {
        await Time.wait(0); // NB: ensure the async variant of the function waits for completion.
        if (e.file.target.name.endsWith('.md')) e.exclude('user-space');
      });

      const res = await tmpl.copy(target);

      for (const op of res.operations) {
        if (op.target.name.endsWith('.md')) {
          expect(op?.action).to.eql('Unchanged');
          expect(op?.excluded).to.eql('user-space');
        } else {
          expect(op.excluded).to.eql(undefined);
        }
      }
    });

    it('fn: file source/target', async () => {
      const { source, target } = SAMPLE.init();
      let count = 0;
      const tmpl = Tmpl.create(source, (e) => {
        count++;
        expect(e.file.source.dir).to.eql(Fs.Path.trimCwd(source));
        expect(e.file.target.dir).to.eql(Fs.Path.trimCwd(target));
      });
      await tmpl.copy(target);
      expect(count).to.greaterThan(0); // NB: ensure the callback ran.
    });

    it('fn: rename', async () => {
      const { source, target } = SAMPLE.init();
      const tmpl = Tmpl.create(source, (e) => {
        if (e.file.target.name === 'mod.ts') e.rename('main.ts');
      });
      const res = await tmpl.copy(target);
      const match = res.operations.find((m) => m.target.name === 'main.ts');
      expect(match?.source.name).to.eql('mod.ts');
      expect(match?.target.name).to.eql('main.ts');
    });

    it('fn: modify (file text)', async () => {
      const { source, target } = SAMPLE.init();
      const tmpl = Tmpl.create(source, (e) => {
        if (e.file.target.name === 'mod.ts') {
          expect(e.text).to.include('{FOO_BAR}');
          e.modify(e.text.replace(/\{FOO_BAR\}/g, '👋 Hello'));
        }
      });
      const res = await tmpl.copy(target);
      const mod = res.operations.find((m) => m.target.name === 'mod.ts');
      const filetext = await Deno.readTextFile(mod?.target.path ?? '');
      expect(mod?.text.before).to.include(`name: '{FOO_BAR}'`);
      expect(mod?.text.after).to.include(`name: '👋 Hello'`);
      expect(filetext).to.include(`name: '👋 Hello'`);
    });

    it('fn: exists (flag)', async () => {
      const { source, target } = SAMPLE.init();
      const tmpl = Tmpl.create(source);
      const a = await tmpl.copy(target);
      const b = await tmpl.copy(target);
      expect(a.operations.every((m) => m.exists === false)).to.eql(true);
      expect(b.operations.every((m) => m.exists === true)).to.eql(true);
    });
  });
});
