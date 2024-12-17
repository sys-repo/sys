import { describe, expect, Fs, it, Time, type t } from '../-test.ts';
import { SAMPLE } from './-u.ts';
import { Tmpl } from './mod.ts';

describe('Tmpl', () => {
  const readFile = Deno.readTextFile;

  const logOps = (
    res: t.TmplCopyResponse,
    title: string,
    options: { indent?: number; hideExcluded?: boolean } = {},
  ) => {
    const { indent, hideExcluded = true } = options;
    console.info(title);
    console.info(Tmpl.Log.ops(res.ops).table({ hideExcluded, indent }));
  };

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

      const a = await tmpl.copy(test.target);
      const b = await tmpl.copy(test.target);

      expect(a.source.dir).to.eql(test.source);
      expect(await a.target.ls()).to.eql(await test.ls.target());
      expect(a.ops.every((m) => m.excluded === false)).to.be.true;
      expect(a.ops.every((m) => m.written === true)).to.be.true;
      expect(a.ops.every((m) => m.created === true)).to.be.true;
      expect(a.ops.every((m) => m.updated === false)).to.be.true;
      expect(a.ops.every((m) => m.forced === false)).to.be.true;

      expect(b.ops.every((m) => m.written === false)).to.be.true;
      expect(b.ops.every((m) => m.created === false)).to.be.true;
      expect(b.ops.every((m) => m.updated === false)).to.be.true;

      logOps(a, 'Copy:', { indent: 2 });
    });

    it('tmpl.copy(): → create → update', async () => {
      const test = SAMPLE.init();
      let foo = 0;
      let count = 0;
      const tmpl = Tmpl.create(test.source, (e) => {
        if (e.file.target.name !== 'mod.ts') return e.exclude();
        e.modify(`const foo = ${foo}`);
        expect(e.file.target.exists).to.eql(count === 0 ? false : true);
        count++;
      });

      const resA = await tmpl.copy(test.target);
      foo = 123; // NB: cuase change in file.
      const resB = await tmpl.copy(test.target); // NB: "updated" via change flag.
      const resC = await tmpl.copy(test.target); // NB: no changes.

      const a = resA.ops.filter((e) => e.written);
      const b = resB.ops.filter((e) => e.written);
      const c = resC.ops.filter((e) => e.written);

      expect(count).to.greaterThan(1);
      expect(a.length).to.eql(1);
      expect(b.length).to.eql(1);
      expect(c.length).to.eql(0);

      expect(a[0].created).to.eql(true);
      expect(a[0].updated).to.eql(false);

      expect(b[0].created).to.eql(false);
      expect(b[0].updated).to.eql(true);

      const indent = 3;
      logOps(resA, 'A: initial', { indent });
      logOps(resB, 'B: changed', { indent });
      logOps(resC, 'C: re-run', { indent });
    });

    it('fn: exclude', async () => {
      const { source, target } = SAMPLE.init();
      const tmpl = Tmpl.create(source, async (e) => {
        await Time.wait(0); // NB: ensure the async variant of the function waits for completion.
        if (e.file.target.name.endsWith('.md')) e.exclude('user-space');
        if (e.file.target.name === '.gitignore') e.exclude();
      });

      const res = await tmpl.copy(target);

      for (const op of res.ops) {
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

    it('fn: rename file', async () => {
      const test = SAMPLE.init();
      const tmpl = Tmpl.create(test.source, (e) => {
        if (e.file.target.name === 'mod.ts') e.rename('main.ts');
      });
      const res = await tmpl.copy(test.target);
      const match = res.ops.find((m) => m.file.target.name === 'main.ts');
      expect(match?.file.source.name).to.eql('mod.ts');
      expect(match?.file.target.name).to.eql('main.ts');
      expect(await test.exists.target('mod.ts')).to.eql(false);
      expect(await test.exists.target('main.ts')).to.eql(true);
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
      const matchA = a.ops.find((m) => m.file.target.name === 'mod.ts');
      const matchB = b.ops.find((m) => m.file.target.name === 'mod.ts');

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

    it('force', async () => {
      const test = SAMPLE.init();
      const tmpl = Tmpl.create(test.source);

      const resA = await tmpl.copy(test.target);
      const resB = await tmpl.copy(test.target); // NB: no changes (already written).
      const resC = await tmpl.copy(test.target, { force: true });

      expect(resA.ops.every((m) => m.forced === false)).to.be.true;
      expect(resB.ops.every((m) => m.forced === false)).to.be.true;
      expect(resC.ops.every((m) => m.forced === true)).to.be.true;

      expect(resA.ops.every((m) => m.written === true)).to.be.true;
      expect(resB.ops.every((m) => m.written === false)).to.be.true;
      expect(resC.ops.every((m) => m.written === true)).to.be.true;

      const indent = 2;
      logOps(resB, 'Not forced:', { indent });
      console.info();
      logOps(resC, 'Forced:', { indent });
    });

    it('force ← with exclusion', async () => {
      const test = SAMPLE.init();
      const tmpl = Tmpl.create(test.source, (e) => {
        if (e.file.target.name === 'doc.md') e.exclude('user-space');
      });

      const resA = await tmpl.copy(test.target);
      const resB = await tmpl.copy(test.target, { force: true });
      expect(await test.exists.target('doc.md')).to.eql(false);

      const indent = 2;
      const hideExcluded = false;
      logOps(resA, 'Initial:', { indent, hideExcluded });
      console.info();
      logOps(resB, 'Forced:', { indent, hideExcluded });
    });
  });
});
