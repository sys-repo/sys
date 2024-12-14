import { Fs, describe, expect, it, Time } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { Tmpl } from './mod.ts';

describe('Tmpl', () => {
  const readFile = Deno.readTextFile;

  it('init: paths', async () => {
    const test = SAMPLE.init();
    const tmpl = Tmpl.create(test.source);
    expect(tmpl.source.dir).to.eql(test.source);
    expect(await tmpl.source.ls()).to.eql(await test.ls.source());
    tmpl;
  });

  describe('tmpl.copy (method)', () => {
    it('copies all source files', async () => {
      const test = SAMPLE.init();
      const tmpl = Tmpl.create(test.source);
      expect(await test.ls.target()).to.eql([]);

      const res = await tmpl.copy(test.target);

      expect(res.source.dir).to.eql(test.source);
      expect(await res.target.ls()).to.eql(await test.ls.target());
      expect(res.operations.every((m) => m.excluded === false)).to.eql(true);
    });

    it('fn: exclude', async () => {
      const { source, target } = SAMPLE.init();
      const tmpl = Tmpl.create(source, async (e) => {
        await Time.wait(0); // NB: ensure the async variant of the function waits for completion.
        if (e.file.target.name.endsWith('.md')) e.exclude('user-space');
        if (e.file.target.name === '.gitignore') e.exclude();
      });

      const res = await tmpl.copy(target);

      for (const op of res.operations) {
        if (op.file.target.name.endsWith('.md')) {
          expect(op?.excluded).to.eql({ reason: 'user-space' }); // NB: excluded with reason.
        } else if (op.file.target.name === '.gitignore') {
          expect(op?.excluded).to.eql(true); // NB: no reason, boolean TRUE (aka. was excluded).
        } else {
          expect(op.excluded).to.eql(false);
        }
      }

      // Ensure excluded files were not copied.
      expect(await Fs.exists(Fs.join(target, 'doc.md'))).to.eql(false);
      expect(await Fs.exists(Fs.join(target, '.gitignore'))).to.eql(false);
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
      const match = res.operations.find((m) => m.file.target.name === 'main.ts');
      expect(match?.file.source.name).to.eql('mod.ts');
      expect(match?.file.target.name).to.eql('main.ts');
    });

    it('fn: modify (file text)', async () => {
      const { source, target } = SAMPLE.init();
      const tmpl = Tmpl.create(source, (e) => {
        if (e.file.target.name === 'mod.ts') {
          const next = e.text.replace(/\{FOO_BAR\}/g, '👋 Hello');
          e.modify(next);
        }
      });

      const a = await tmpl.copy(target);
      const b = await tmpl.copy(target);
      const matchA = a.operations.find((m) => m.file.target.name === 'mod.ts');
      const matchB = b.operations.find((m) => m.file.target.name === 'mod.ts');

      expect(matchA?.text.source).to.include(`name: '{FOO_BAR}'`);
      expect(matchA?.text.target.before).to.include(''); // NB: Nothing has been written yet.
      expect(matchA?.text.target.after).to.include(`name: '👋 Hello'`);
      expect(matchB?.text.target.before).to.include(`name: '👋 Hello'`); // NB: prior written modification (already exists).
      expect(await readFile(matchA?.file.target.path ?? '')).to.include(`name: '👋 Hello'`);

      const writtenA = await readFile(Fs.join(a.target.dir, 'mod.ts'));
      const writtenB = await readFile(Fs.join(a.target.dir, 'mod.ts'));
      expect(writtenA).to.include(`name: '👋 Hello'`);
      expect(writtenB).to.include(`name: '👋 Hello'`);
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
