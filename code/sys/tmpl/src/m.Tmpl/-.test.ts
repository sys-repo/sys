import { type t, describe, expect, expectError, Fs, it, R, SAMPLE, Time } from '../-test.ts';
import { Tmpl } from './mod.ts';

describe('Tmpl', () => {
  const readFile = async (path: string) => (await Fs.readText(path)).data;
  const Test = SAMPLE.fs('m.Tmpl');

  const logOps = (
    res: t.TmplWriteResponse,
    title: string,
    options: { indent?: number; hideExcluded?: boolean } = {},
  ) => {
    const { indent, hideExcluded = true } = options;
    console.info(title);
    console.info(Tmpl.Log.table(res.ops, { hideExcluded, indent }));
  };

  it('init: paths', async () => {
    const test = Test.sample1();
    const tmpl = Tmpl.create(test.source);
    expect(tmpl.source.absolute).to.eql(test.source);
    expect(await tmpl.source.ls()).to.eql(await test.ls.source());
    tmpl;
  });

  describe('tmpl.write:', () => {
    it('copies all source files', async () => {
      const test = Test.sample1();
      const tmpl = Tmpl.create(test.source);
      expect(await test.ls.target()).to.eql([]);

      const a = await tmpl.write(test.target);
      const b = await tmpl.write(test.target);

      expect(a.source.absolute).to.eql(test.source);
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

    it('copies binary files (eg ".jpg")', async () => {
      const test = Test.sample2();
      const tmpl = Tmpl.create(test.source);

      const res = await tmpl.write(test.target);
      const sourcePath = Fs.join(res.source.absolute, 'images/volcano.jpg');
      const targetPath = Fs.join(res.target.absolute, 'images/volcano.jpg');

      const source = await Fs.read(sourcePath);
      const target = await Fs.read(targetPath);

      expect(String(source.data).startsWith('255,216,255,224,0,16')).to.be.true; // NB: source file contains data.
      expect(target.exists).to.eql(true);
      expect(target.data).to.eql(source.data);
    });

    it('writes when file-processor function is NOT specified', async () => {
      const sample1 = Test.sample1();
      const sample2 = Test.sample2();
      const tmpl1 = Tmpl.create(sample1.source);
      const tmpl2 = Tmpl.create(sample2.source);

      await tmpl1.write(sample1.target);
      await tmpl2.write(sample2.target);

      const assertIncludes = (paths: string[], path: string) => {
        const match = paths.some((p) => p.endsWith(path));
        expect(match).to.be.true;
      };

      const targets1 = await sample1.ls.target();
      const targets2 = await sample2.ls.target();

      assertIncludes(targets1, '.gitignore');
      assertIncludes(targets1, 'deno.json');
      assertIncludes(targets1, 'mod.ts');
      assertIncludes(targets1, 'docs/index.md');

      assertIncludes(targets2, 'README.md');
      assertIncludes(targets2, 'images/volcano.jpg');
    });

    it('tmpl.write(): → create → update', async () => {
      const test = Test.sample1();
      let foo = 0;
      let count = 0;
      const tmpl = Tmpl.create(test.source, (e) => {
        if (e.target.file.name !== 'mod.ts') return e.exclude();
        e.modify(`const foo = ${foo}`);
        expect(e.target.exists).to.eql(count === 0 ? false : true);
        expect(e.ctx).to.eql(undefined);
        count++;
      });

      const resA = await tmpl.write(test.target);
      foo = 123; // NB: cause change in file.
      const resB = await tmpl.write(test.target); // NB: "updated" via change flag.
      const resC = await tmpl.write(test.target); // NB: no changes.

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

    describe('fn: processFile (callback)', () => {
      it('fn: exclude', async () => {
        const { source, target } = Test.sample1();
        const tmpl = Tmpl.create(source, async (e) => {
          await Time.wait(0); // NB: ensure the async variant of the function waits for completion.
          if (e.target.file.name.endsWith('.md')) e.exclude('user-space');
          if (e.target.file.name === '.gitignore') e.exclude();
        });

        const res = await tmpl.write(target);

        for (const op of res.ops) {
          if (op.file.target.file.name.endsWith('.md')) {
            expect(op?.excluded).to.eql({ reason: 'user-space' }); // NB: excluded with reason.
          } else if (op.file.target.file.name === '.gitignore') {
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
        const { source, target } = Test.sample1();
        let count = 0;
        const tmpl = Tmpl.create(source, (e) => {
          count++;
          expect(e.tmpl.base).to.eql(source);
          expect(e.target.base).to.eql(target);
        });
        await tmpl.write(target);
        expect(count).to.greaterThan(0); // NB: ensure the callback ran.
      });

      it('fn: rename file', async () => {
        const test = Test.sample1();
        const tmpl = Tmpl.create(test.source, (e) => {
          if (e.target.file.name === 'mod.ts') e.rename('main.ts');
        });
        const res = await tmpl.write(test.target);
        const match = res.ops.find((m) => m.file.target.file.name === 'main.ts');
        expect(match?.file.tmpl.file.name).to.eql('mod.ts');
        expect(match?.file.target.file.name).to.eql('main.ts');
        expect(await test.exists.target('mod.ts')).to.eql(false);
        expect(await test.exists.target('main.ts')).to.eql(true);
      });

      it('fn: modify (file text)', async () => {
        const { source, target } = Test.sample1();
        const tmpl = Tmpl.create(source, (e) => {
          if (!e.text) return;
          if (e.target.file.name === 'mod.ts') {
            const next = e.text.tmpl.replace(/\{FOO_BAR\}/g, '👋 Hello');
            e.modify(next);
          }
        });

        const a = await tmpl.write(target);
        const b = await tmpl.write(target);
        const matchA = a.ops.find((m) => m.file.target.file.name === 'mod.ts');
        const matchB = b.ops.find((m) => m.file.target.file.name === 'mod.ts');

        expect(!!(matchA?.text && matchB?.text)).to.be.true;

        if (matchA?.contentType === 'text' && matchB?.contentType === 'text') {
          expect(matchA.text.tmpl).to.include(`name: '{FOO_BAR}'`);
          expect(matchA.text.target.before).to.include(''); // NB: Nothing has been written yet.
          expect(matchA.text.target.after).to.include(`name: '👋 Hello'`);
          expect(matchA.text.target.isDiff).to.eql(true);
          expect(matchB.text.target.before).to.include(`name: '👋 Hello'`); // NB: prior written modification (already exists).
          expect(await readFile(matchA.file.target.absolute ?? '')).to.include(`name: '👋 Hello'`);
        }

        const writtenA = await readFile(a.target.join('mod.ts'));
        const writtenB = await readFile(b.target.join('mod.ts'));

        expect(writtenA).to.include(`name: '👋 Hello'`);
        expect(writtenB).to.include(`name: '👋 Hello'`);
      });

      it('fn: modify (binary file)', async () => {
        const { source, target } = Test.sample2();
        const jpg = (await Fs.read('./src/-test/sample-2/images/volcano.jpg')).data;
        let replaceWith: Uint8Array | undefined;

        const tmpl = Tmpl.create(source, (e) => {
          if (e.contentType !== 'binary') return;
          if (replaceWith) e.modify(replaceWith);
        });

        const a = await tmpl.write(target);
        replaceWith = new Uint8Array([1, 2, 3]);
        const b = await tmpl.write(target);

        const matchA = a.ops.find((m) => m.file.target.file.name === 'volcano.jpg');
        const matchB = b.ops.find((m) => m.file.target.file.name === 'volcano.jpg');

        if (matchA?.contentType === 'binary' && matchB?.contentType === 'binary') {
          expect(matchA.binary.tmpl).to.eql(jpg);
          expect(matchA.binary.target.before).to.eql(new Uint8Array(0)); // NB: Nothing has been written yet.
          expect(matchA.binary.target.after).to.eql(jpg);
          expect(matchA.binary.target.isDiff).to.eql(true);
          expect(matchB.binary.target.after).to.eql(replaceWith);
        }

        const writtenFile = (await Fs.read(b.target.join('images/volcano.jpg'))).data;
        expect(writtenFile).to.eql(replaceWith);
      });

      it('fn: modify with wrong type (throws)', async () => {
        const sample1 = Test.sample1();
        const sample2 = Test.sample2();

        const a = Tmpl.create(sample1.source, (e) => {
          if (e.contentType === 'text') e.modify(new Uint8Array([1, 2, 3])); // NB: error.
        });
        const b = Tmpl.create(sample2.source, (e) => {
          if (e.contentType === 'binary') e.modify('fail'); // NB: error.
        });

        await expectError(
          () => a.write(sample1.target),
          'Expected string content to update text-file',
        );

        await expectError(
          () => b.write(sample2.target),
          'Expected Uint8Array content to update binary-file',
        );
      });

      it('fn: {ctx} passed constructor param', async () => {
        const { source, target } = Test.sample1();
        const ctx = { foo: 'root' };
        const fired = [] as any[];
        const tmpl = Tmpl.create(source, { ctx, processFile: (e) => fired.push(e.ctx) });

        const a = await tmpl.write(target);
        const b = await tmpl.write(target, { ctx: { bar: 456 } });
        const c = await tmpl.write(target, { ctx: { foo: 123, bar: 456 } });

        expect(fired.every((m) => !!m)).to.be.true;
        expect(a.ctx).to.eql(ctx);
        expect(b.ctx).to.eql({ foo: 'root', bar: 456 });
        expect(c.ctx).to.eql({ foo: 123, bar: 456 }); // NB: root {ctx} overwritten.
      });

      it('fn: {ctx} passed via .write() param', async () => {
        const { source, target } = Test.sample1();
        const ctx = { foo: 123 };
        const fired = [] as any[];
        const tmpl = Tmpl.create(source, (e) => fired.push(e.ctx));

        const a = await tmpl.write(target, { ctx });
        expect(fired.filter(Boolean).length).to.be.greaterThan(1);
        expect(fired.every((m) => R.equals(m, ctx))).to.be.true;
        expect(a.ctx).to.eql(ctx);

        // No context provided.
        const beforeLength = fired.filter(Boolean).length;
        const b = await tmpl.write(target);
        expect(fired.filter(Boolean).length).to.eql(beforeLength);
        expect(b.ctx).to.eql(undefined);
      });
    });

    describe('fn: beforeWrite | afterWrite (callbacks)', () => {
      it('beforeWrite: sync/async', async () => {
        const { source, target } = Test.sample1();
        const fired: t.TmplWriteHandlerArgs[] = [];

        const a: t.TmplWriteHandler = (e) => fired.push(e);
        const b: t.TmplWriteHandler = async (e) => {
          expect((await fired[0].dir.target.ls()).length).to.greaterThan(0); // NB: files already exist.
          fired.push(e);
        };
        const tmpl = Tmpl.create(source, { beforeWrite: a }).filter(() => true); // NB: .filter tests that the before/after handlers are passed through.

        await tmpl.write(target);
        expect(fired.length).to.eql(1);

        await tmpl.write(target, { onBefore: [b] });
        expect(fired.length).to.eql(3); // NB: 2-more (the constructor callback PLUS callback passed to the copy paramemter).
        expect(fired.every((m) => m.ctx === undefined)).to.eql(true); // NB: {ctx} not passed to the [Tmpl.write] method.
      });

      it('afterWrite: sync/async', async () => {
        const { source, target } = Test.sample1();
        const fired: t.TmplWriteHandlerArgs[] = [];

        const a: t.TmplWriteHandler = (e) => fired.push(e);
        const b: t.TmplWriteHandler = async (e) => {
          expect((await fired[0].dir.target.ls()).length).to.greaterThan(0); // NB: files already exist.
          fired.push(e);
        };
        const tmpl = Tmpl.create(source, { afterWrite: a });

        await tmpl.write(target);
        expect(fired.length).to.eql(1);

        await tmpl.write(target, { onAfter: [b] });
        expect(fired.length).to.eql(3); // NB: 2-more (the constructor callback PLUS callback passed to the copy paramemter).
        expect(fired.every((m) => m.ctx === undefined)).to.eql(true); // NB: {ctx} not passed to the [Tmpl.write] method.
      });

      it('{ctx} passed via .write() param', async () => {
        const { source, target } = Test.sample1();
        const ctx = { foo: 123 };
        const fired = {
          before: [] as any[],
          after: [] as any[],
        };
        const onBefore: t.TmplWriteHandler = (e) => fired.before.push(e.ctx);
        const onAfter: t.TmplWriteHandler = (e) => fired.after.push(e.ctx);
        const tmpl = Tmpl.create(source);

        // No context provided, so {ctx} not passed through before/after callbacks.
        await tmpl.write(target, { onBefore, onAfter });
        expect(fired.before.length).to.greaterThan(0);
        expect(fired.after.length).to.greaterThan(0);
        expect(fired.before.filter(Boolean).length).to.eql(0);
        expect(fired.after.filter(Boolean).length).to.eql(0);

        // Before/after callbacks provided with {ctx}.
        await tmpl.write(target, { ctx, onBefore, onAfter });
        expect(fired.before.filter(Boolean).length).to.eql(1);
        expect(fired.after.filter(Boolean).length).to.eql(1);
        expect(fired.before.filter(Boolean).every((m) => R.equals(m, ctx))).to.be.true;
        expect(fired.after.filter(Boolean).every((m) => R.equals(m, ctx))).to.be.true;
      });
    });

    describe('flag: force', () => {
      it('force', async () => {
        const test = Test.sample1();
        const tmpl = Tmpl.create(test.source);

        const resA = await tmpl.write(test.target);
        const resB = await tmpl.write(test.target); // NB: no changes (already written).
        const resC = await tmpl.write(test.target, { force: true });

        expect(resA.ops.every((m) => m.forced === false)).to.be.true;
        expect(resB.ops.every((m) => m.forced === false)).to.be.true;
        expect(resC.ops.every((m) => m.forced === true)).to.be.true;

        expect(resA.ops.every((m) => m.written === true)).to.be.true;
        expect(resB.ops.every((m) => m.written === false)).to.be.true; // NB: no change to write.
        expect(resC.ops.every((m) => m.written === true)).to.be.true; //  NB: no change, but forced.

        const indent = 2;
        logOps(resB, 'Not forced:', { indent });
        console.info();
        logOps(resC, 'Forced:', { indent });
      });

      it('force ← (with exclusions)', async () => {
        const test = Test.sample1();
        const tmpl = Tmpl.create(test.source, (e) => {
          if (!e.target.exists) return; // NB: create the user-space file if it does not yet exist
          if (e.target.file.name === 'doc.md') e.exclude('user-space');
        });

        const resA = await tmpl.write(test.target);
        const resB = await tmpl.write(test.target, { force: true });
        expect(await test.exists.target('docs/index.md')).to.eql(true);

        const indent = 2;
        const hideExcluded = false;
        logOps(resA, 'Initial:', { indent, hideExcluded });
        console.info();
        logOps(resB, 'Forced:', { indent, hideExcluded });
      });
    });

    describe('flag: dryRun (default: false)', () => {
      it('dryRun: true (does not write)', async () => {
        const test = Test.sample1();
        const tmpl = Tmpl.create(test.source);
        const res = await tmpl.write(test.target, { dryRun: true });
        expect(res.ops.every((m) => m.written === false)).to.be.true;
        for (const op of res.ops) {
          expect(await Fs.exists(op.file.target.absolute)).to.eql(false);
        }
      });

      it('logs as "dry run"', async () => {
        const test = Test.sample1();
        const tmpl = Tmpl.create(test.source);
        const res = await tmpl.write(test.target, { dryRun: true });
        const table = Tmpl.Log.table(res.ops);
        expect(table).to.include('dry-run');
        console.info(table);
      });
    });
  });

  describe('tmpl.filter:', () => {
    const includes = (paths: string[], endsWith: string) => {
      return paths.some((path) => path.endsWith(endsWith));
    };

    it('single-level filter', async () => {
      const test = Test.sample1();
      const tmpl1 = Tmpl.create(test.source);
      const tmpl2 = Tmpl.create(test.source).filter((e) => e.file.name !== '.gitignore');
      expect(includes(await tmpl1.source.ls(), '/.gitignore')).to.be.true;
      expect(includes(await tmpl2.source.ls(), '/.gitignore')).to.be.false;
    });

    it('multi-level filter', async () => {
      const test = Test.sample1();
      const tmpl1 = Tmpl.create(test.source).filter((e) => e.file.name !== '.gitignore');
      const tmpl2 = tmpl1.filter((e) => !e.file.name.endsWith('.md'));
      expect(includes(await tmpl1.source.ls(), '/.gitignore')).to.be.false;
      expect(includes(await tmpl1.source.ls(), '/index.md')).to.be.true;
      expect(includes(await tmpl2.source.ls(), '/index.md')).to.be.false;
    });

    it('does not copy filtered files', async () => {
      const test = Test.sample1();
      const tmpl = Tmpl.create(test.source).filter((e) => !e.file.name.endsWith('.md'));
      await tmpl.write(test.target);

      const paths = await test.ls.target();
      expect(paths.length).to.greaterThan(2);
      expect(includes(paths, '.md')).to.be.false;
    });
  });
});
