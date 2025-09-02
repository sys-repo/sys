import { c, describe, expect, expectError, it, SAMPLE, type t } from '../../-test.ts';
import { File } from '../../m.file/mod.ts';
import { Log } from '../../m.log/mod.ts';

import { FileMap, Fs, Path, Str, Time } from '../common.ts';
import { TmplEngine } from '../mod.ts';

describe('Tmpl', () => {
  const Test = SAMPLE.fs('m.Tmpl');

  const logOps = (
    res: t.TmplWriteResult,
    title: string,
    options: { indent?: number; hideExcluded?: boolean; pad?: boolean } = {},
  ) => {
    const { indent, hideExcluded = true, pad = true } = options;
    const tbl = TmplEngine.Log.table(res.ops, { hideExcluded, indent });
    if (pad) console.info();
    console.info(c.bold(c.cyan(title)), '\n');
    console.info(tbl);
    if (pad) console.info();
  };

  it('API', () => {
    expect(TmplEngine.File).to.equal(File);
    expect(TmplEngine.Log).to.equal(Log);
    expect(TmplEngine.FileMap).to.equal(FileMap);
  });

  describe('init: source path/file-map', () => {
    it('via path', async () => {
      const test = Test.sample1();
      const tmpl = TmplEngine.from(test.source);
      const source = await tmpl.source();
      expect(source.dir).to.equal(test.source);
      expect(Object.keys(source.fileMap)).to.eql(await test.ls.source(true));
    });

    it('via file-map', async () => {
      const test = Test.sample1();
      const fileMap = await FileMap.toMap(test.source);
      const tmpl = TmplEngine.from(fileMap);
      const source = await tmpl.source();
      expect(source.dir).to.equal('');
      expect(Object.keys(source.fileMap)).to.eql(await test.ls.source(true));
    });
  });

  describe('tmpl.write:', () => {
    it('copies all source files - once', async () => {
      const test = Test.sample1();
      const tmpl = TmplEngine.from(test.source);
      expect(await test.ls.target()).to.eql([]);

      const a = await tmpl.write(test.target);
      const b = await tmpl.write(test.target);

      expect(a.dir.source).to.eql(test.source);
      expect(a.dir.target).to.eql(test.target);

      const copiedFiles = await test.ls.target(true);
      expect(copiedFiles.length).to.be.least(4);
      expect(await test.ls.source(true)).to.eql(copiedFiles);

      expect(a.ops.every((m) => m.kind === 'create')).to.eql(true);
      expect(b.ops.every((m) => m.kind === 'skip')).to.eql(true);

      // Print:
      console.info(Str.SPACE);
      logOps(a, 'T: TmplWriteResult (first):', { indent: 2, pad: false });
      console.info(Str.SPACE);
      logOps(b, 'T: TmplWriteResult (second):', { indent: 2, pad: false });
      console.info(Str.SPACE);
    });

    it('copies binary files (eg ".jpg")', async () => {
      const test = Test.sample2();
      const tmpl = TmplEngine.from(test.source);

      const res = await tmpl.write(test.target);
      const sourcePath = Fs.join(test.source, 'images/volcano.jpg');
      const targetPath = Fs.join(test.target, 'images/volcano.jpg');

      const source = await Fs.read(sourcePath);
      const target = await Fs.read(targetPath);

      expect(String(source.data).startsWith('255,216,255,224,0,16')).to.be.true; // NB: source file contains data.
      expect(target.exists).to.eql(true);
      expect(target.data).to.eql(source.data);

      logOps(res, 'copies binary files');
    });

    it('writes when file-processor function is NOT specified', async () => {
      const sample1 = Test.sample1();
      const sample2 = Test.sample2();
      const tmpl1 = TmplEngine.from(sample1.source);
      const tmpl2 = TmplEngine.from(sample2.source);

      const a = await tmpl1.write(sample1.target);
      const b = await tmpl2.write(sample2.target);

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

    it('tmpl.write(): create → modify → no-op', async () => {
      const test = Test.sample1();

      let foo = 0;
      let lastFoo: number | undefined; // ← track input used last time
      let processed = 0;

      // Template: only act on "mod.ts"; skip everything else.
      const tmpl = TmplEngine.from(test.source, async (e) => {
        processed++;

        if (e.target.filename === 'mod.ts') {
          // Only modify when input changed
          if (lastFoo !== foo) {
            e.modify(`export const foo = ${foo}\n`);
            lastFoo = foo;
          } else {
            e.skip('unchanged');
          }
        } else {
          e.skip('not target');
        }

        expect(e.ctx).to.eql(undefined);
      });

      // 1) First write → should CREATE mod.ts:
      const resA = await tmpl.write(test.target);

      // 2) Change input, write again → should MODIFY mod.ts:
      foo = 123;
      const resB = await tmpl.write(test.target);

      // 3) No change, write again → should SKIP everything:
      const resC = await tmpl.write(test.target);

      // Sanity: processor ran on > 1 file (bundle has more than mod.ts).
      expect(processed).to.be.greaterThan(1);

      // Helpers:
      const basename = (p: string) => Path.basename(p);
      const createdA = resA.ops.filter((o) => o.kind === 'create');
      const modifiedB = resB.ops.filter((o) => o.kind === 'modify');

      // A: exactly one create, for mod.ts; everything else skipped.
      expect(createdA).to.have.length(1);
      expect(basename(createdA[0].path)).to.eql('mod.ts');
      expect(
        resA.ops.every((o) => (o.kind === 'create' ? basename(o.path) === 'mod.ts' : true)),
      ).to.eql(true);

      // B: exactly one modify, for mod.ts; everything else skipped.
      expect(modifiedB).to.have.length(1);
      expect(basename(modifiedB[0].path)).to.eql('mod.ts');
      expect(
        resB.ops.every((o) => (o.kind === 'modify' ? basename(o.path) === 'mod.ts' : true)),
      ).to.eql(true);

      // C: no writes at all; all skipped.
      expect(resC.ops.every((o) => o.kind === 'skip')).to.eql(true);

      // Verify the updated content landed after step B
      const modAbs = Path.join(test.target, 'mod.ts');
      const modText = await Fs.readText(modAbs);
      expect(modText.exists).to.eql(true);
      expect(modText.data?.includes('export const foo = 123')).to.eql(true);
    });

    describe.only('fn: processFile (callback)', () => {
      it('fn: skip', async () => {
        const { source, target } = Test.sample1();
        const tmpl = TmplEngine.from(source, async (e) => {
          await Time.wait(0); // Ensure the async callback path is honored.
          if (e.target.filename.endsWith('.md')) e.skip('user-space');
          if (e.target.filename === '.gitignore') e.skip();
        });

        const res = await tmpl.write(target);

        for (const op of res.ops) {
          const name = Path.basename(op.path);

          type S = t.FileMapOpOfKind<'skip'>;
          if (name.endsWith('.md')) {
            expect(op.kind).to.eql('skip');
            expect((op as S).reason).to.eql('user-space'); // skipped with explicit reason.
          } else if (name === '.gitignore') {
            expect(op.kind).to.eql('skip');
            expect((op as S).reason).to.eql(undefined); // skipped without reason.
          } else {
            // Everything else should be materialized (created or, on re-runs, modified).
            expect(op.kind === 'create' || op.kind === 'modify').to.eql(true);
          }
        }

        // Ensure skipped files were not copied.
        expect(await Fs.exists(Path.join(target, 'doc.md'))).to.eql(false);
        expect(await Fs.exists(Path.join(target, '.gitignore'))).to.eql(false);

        logOps(res, 'T: TmplWriteResult (skip):', { indent: 2 });
      });

      it('fn: file source/target', async () => {
        const { source, target } = Test.sample1();
        let count = 0;

        const tmpl = TmplEngine.from(source, (e) => {
          count++;
          // Target dir should reflect the write destination:
          expect(e.target.dir).to.eql(target);

          // Basic invariants exposed by FileMapProcessorArgs:
          expect(e.target.filename).to.eql(Path.basename(e.target.relative));
          expect(typeof e.target.absolute).to.eql('string');
        });

        await tmpl.write(target);
        expect(count).to.be.greaterThan(0); // ensure the callback ran
      });

      it('fn: rename file', async () => {
        const test = Test.sample1();

        const tmpl = TmplEngine.from(test.source, (e) => {
          if (e.target.filename === 'mod.ts') e.target.rename('main.ts');
        });

        const res = await tmpl.write(test.target);

        // Find the op that produced main.ts
        const match = res.ops.find((op) => Path.basename(op.path) === 'main.ts');
        expect(!!match).to.eql(true);

        if (match) {
          // First pass → should be a create with rename meta
          expect(match.kind).to.eql('create');
          expect((match as t.FileMapOpOfKind<'create'>).renamed?.from).to.eql('mod.ts');
        }

        // Filesystem reflects the rename
        expect(await test.exists.target('mod.ts')).to.eql(false);
        expect(await test.exists.target('main.ts')).to.eql(true);

        logOps(res, 'T: TmplWriteResult (rename):', { indent: 2 });
      });

      it('fn: modify (file text)', async () => {
        const { source, target } = Test.sample1();

        const tmpl = TmplEngine.from(source, (e) => {
          if (!e.text) return; // only operate on text files
          if (e.target.filename === 'mod.ts') {
            // Replace the known placeholder deterministically
            e.modify(e.text.replace(/\{FOO_BAR\}/g, '👋 Hello'));
          } else {
            e.skip('not target');
          }
        });

        // First write → create
        const a = await tmpl.write(target);
        // Second write → modify (we call modify() again)
        const b = await tmpl.write(target);

        const modA = a.ops.find((op) => Path.basename(op.path) === 'mod.ts');
        const modB = b.ops.find((op) => Path.basename(op.path) === 'mod.ts');

        expect(!!modA && !!modB).to.eql(true);
        if (modA && modB) {
          expect(modA.kind).to.eql('create');
          expect(modB.kind).to.eql('modify');
        }

        const written1 = await Fs.readText(Path.join(target, 'mod.ts'));
        const written2 = await Fs.readText(Path.join(target, 'mod.ts'));
        expect(written1.exists && written2.exists).to.eql(true);

        // Deterministic assertion (no ORs)
        expect(written1.data ?? '').to.include('👋 Hello');
        expect(written2.data ?? '').to.include('👋 Hello');

        logOps(b, 'T: TmplWriteResult (modify text):', { indent: 2 });
      });

      it('fn: modify (binary file)', async () => {
        const { source, target } = Test.sample2();

        // Original bytes from the fixture
        const original = (await Fs.read(Path.join(source, 'images/volcano.jpg'))).data!;
        let replaceWith: Uint8Array | undefined;

        const tmpl = TmplEngine.from(source, (e) => {
          const name = e.target.filename;
          if (name !== 'volcano.jpg') return e.skip('not target');
          if (replaceWith) e.modify(replaceWith); // only on second run
        });

        // 1) First write → CREATE with original bytes
        const a = await tmpl.write(target);

        // Verify bytes on disk immediately after the first write
        const abs = Path.join(target, 'images', 'volcano.jpg');
        const afterFirst = (await Fs.read(abs)).data!;
        expect(afterFirst).to.eql(original);

        // 2) Second write → MODIFY with new bytes
        replaceWith = new Uint8Array([1, 2, 3]);
        const b = await tmpl.write(target);

        // Verify bytes after the second write
        const afterSecond = (await Fs.read(abs)).data!;
        expect(afterSecond).to.eql(replaceWith);

        // Op assertions
        const pick = (ops: readonly t.FileMapOp[], base: string): t.FileMapOp => {
          const m = ops.find((op) => Path.basename(op.path) === base);
          if (!m) throw new Error(`op not found: ${base}`);
          return m;
        };
        const opA = pick(a.ops, 'volcano.jpg');
        const opB = pick(b.ops, 'volcano.jpg');

        expect(opA.kind).to.eql('create');
        expect(opB.kind).to.eql('modify');

        logOps(b, 'T: TmplWriteResult (modify binary):', { indent: 2 });
      });

      it('fn: modify(text) with Uint8Array → throws', async () => {
        const sample = Test.sample1(); // stable text fixture (includes mod.ts / md)
        const tmpl = TmplEngine.from(sample.source, (e) => {
          // Deterministically hit a text file; skip the rest
          if (e.text && (e.target.filename === 'mod.ts' || e.target.filename.endsWith('.md'))) {
            e.modify(new Uint8Array([1, 2, 3]) as any); // wrong type → should throw
          } else {
            e.skip('not target');
          }
        });

        await expectError(
          () => tmpl.write(sample.target),
          'Expected string content to update text-file',
        );
      });

      it('fn: modify(binary) with string → throws', async () => {
        const sample = Test.sample2(); // stable binary fixture (includes images/volcano.jpg)
        const tmpl = TmplEngine.from(sample.source, (e) => {
          // Deterministically hit the binary file; skip the rest
          if (!e.text && e.target.filename === 'volcano.jpg') {
            e.modify('nope' as any); // wrong type → should throw
          } else {
            e.skip('not target');
          }
        });

        await expectError(
          () => tmpl.write(sample.target),
          'Expected Uint8Array content to update binary-file',
        );
      });

      it('fn: {ctx} passed constructor param', async () => {
        const { source, target } = Test.sample1();

        const rootCtx = { foo: 'root' };
        const fired: unknown[] = [];

        const tmpl = TmplEngine.from(source, {
          ctx: rootCtx,
          processFile(e) {
            fired.push(e.ctx); // record whatever the processor saw
          },
        });

        // First run: uses root ctx
        const startA = fired.length;
        const a = await tmpl.write(target);
        const seenA = fired.slice(startA);
        expect(seenA.length).to.be.greaterThan(0);
        expect(seenA.some((m) => m && (m as any).foo === 'root')).to.eql(true);
        expect(a.ctx).to.eql(rootCtx);

        // Second run: merges root + override
        const startB = fired.length;
        const b = await tmpl.write(target, { ctx: { bar: 456 } });
        const seenB = fired.slice(startB);
        expect(seenB.length).to.be.greaterThan(0);
        expect(
          seenB.some((m) => JSON.stringify(m) === JSON.stringify({ foo: 'root', bar: 456 })),
        ).to.eql(true);
        expect(b.ctx).to.eql({ foo: 'root', bar: 456 });

        // Third run: override replaces root.foo
        const startC = fired.length;
        const c = await tmpl.write(target, { ctx: { foo: 123, bar: 456 } });
        const seenC = fired.slice(startC);
        expect(seenC.length).to.be.greaterThan(0);
        expect(
          seenC.some((m) => JSON.stringify(m) === JSON.stringify({ foo: 123, bar: 456 })),
        ).to.eql(true);
        expect(c.ctx).to.eql({ foo: 123, bar: 456 });
      });

      it('fn: {ctx} passed via .write() param', async () => {
        const { source, target } = Test.sample1();
        const ctx = { foo: 123 };
        const fired: unknown[] = [];

        const tmpl = TmplEngine.from(source, {
          processFile: (e) => {
            fired.push(e.ctx); // record whatever ctx the processor sees
          },
        });

        // Run with ctx → every processor call should see it; result carries it.
        const a = await tmpl.write(target, { ctx });
        expect(fired.filter(Boolean).length).to.be.greaterThan(1); // processor fired on multiple files
        expect(fired.every((m) => !!m && (m as any).foo === 123)).to.be.true;
        expect(a.ctx).to.eql(ctx);

        // Run without ctx → no *new* truthy ctx entries; result ctx is undefined.
        const truthyBefore = fired.filter(Boolean).length;
        const b = await tmpl.write(target);
        const truthyAfter = fired.filter(Boolean).length;

        expect(truthyAfter).to.eql(truthyBefore);
        expect(b.ctx).to.eql(undefined);
      });

      describe('flag: force', () => {
        it('force', async () => {
          const test = Test.sample1();
          const tmpl = TmplEngine.from(test.source);

          const resA = await tmpl.write(test.target); // ← first run
          const resB = await tmpl.write(test.target); // ← unchanged
          const resC = await tmpl.write(test.target, { force: true }); // forced overwrite

          // A: first run → all creates, no forced flags:
          expect(resA.ops.every((o) => o.kind === 'create' && o.forced !== true)).to.be.true;

          // B: unchanged → all skips (reason "unchanged" is fine), no forced flags:
          expect(resB.ops.every((o) => o.kind === 'skip' && o.forced !== true)).to.be.true;
          expect(resB.ops.some((o) => o.kind === 'skip' && o.reason === 'unchanged')).to.be.true;

          // C: force → all modifies and forced=true:
          expect(resC.ops.every((o) => o.kind === 'modify' && o.forced === true)).to.be.true;

          logOps(resC, 'T: TmplWriteResult (--force):', { indent: 2 });
        });
      });

      it('force ← (with skips)', async () => {
        const test = Test.sample1();

        // Skip exactly docs/index.md when it already exists (user-space protection):
        const tmpl = TmplEngine.from(test.source, async (e) => {
          const existed = await e.target.exists();
          if (!existed) return; // first run: let everything be created.
          if (e.target.relative === 'docs/index.md') e.skip('user-space'); // second run: protect this file even under force.
        });

        // A: first write → creates everything:
        const resA = await tmpl.write(test.target);

        // B: forced write → modifies all except the protected one (which is skipped with reason):
        const resB = await tmpl.write(test.target, { force: true });

        // Sanity: sample content landed:
        expect(await test.exists.target('docs/index.md')).to.eql(true);

        // A: all creates, none forced:
        expect(resA.ops.every((o) => o.kind === 'create' && o.forced !== true)).to.eql(true);

        // B: one specific skip with reason, all others are forced modifies:
        const isDocsIndex = (o: t.TmplWriteOp) =>
          Path.basename(o.path) === 'index.md' && /docs[\\/]/.test(o.path);

        const skipped = resB.ops.find((o) => o.kind === 'skip' && isDocsIndex(o)) as
          | t.FileMapOpOfKind<'skip'>
          | undefined;
        expect(!!skipped).to.eql(true);
        if (skipped) expect(skipped.reason).to.eql('user-space');

        const others = resB.ops.filter((o) => !isDocsIndex(o));
        expect(others.length > 0).to.eql(true);
        expect(others.every((o) => o.kind === 'modify' && o.forced === true)).to.eql(true);

        logOps(resB, 'T: TmplWriteResult (--force with skips):', { indent: 2 });
      });

      describe('flag: dryRun (default: false)', () => {
        it('dryRun: true (does not write)', async () => {
          const test = Test.sample1();
          const tmpl = TmplEngine.from(test.source);

          const res = await tmpl.write(test.target, { dryRun: true });

          expect(res.ops.length).to.be.greaterThan(0);
          expect(res.ops.every((o) => o.dryRun === true)).to.eql(true);

          // Nothing written under the target directory.
          for (const op of res.ops) {
            const abs = Path.join(test.target, op.path); // ← check in target
            expect(await Fs.exists(abs)).to.eql(false);
          }
        });

        it('logs as "dry run"', async () => {
          const test = Test.sample1();
          const tmpl = TmplEngine.from(test.source);

          const res = await tmpl.write(test.target, { dryRun: true });

          const table = TmplEngine.Log.table(res.ops, { baseDir: test.target });
          expect(table).to.include('dry-run');

          // Optional: check there are no non-dry entries.
          expect(/dry-run/.test(table)).to.eql(true);
          logOps(res, 'T: TmplWriteResult (--dryRun):', { indent: 2 });
        });
      });
    });
  });

  describe('tmpl.filter:', () => {
    const includes = (subject: t.FileMap | string[], endsWith: string) => {
      const paths = Array.isArray(subject) ? subject : Object.keys(subject);
      return paths.some((path) => path.endsWith(endsWith));
    };

    it('single-level filter', async () => {
      const test = Test.sample1();
      const tmpl1 = TmplEngine.from(test.source);
      const tmpl2 = TmplEngine.from(test.source).filter((e) => e.filename !== '.gitignore');

      const source1 = await tmpl1.source();
      const source2 = await tmpl2.source();

      expect(includes(source1.fileMap, '.gitignore')).to.be.true;
      expect(includes(source2.fileMap, '.gitignore')).to.be.false;
    });

    it('multi-level filter', async () => {
      const test = Test.sample1();
      const tmpl1 = TmplEngine.from(test.source).filter((e) => e.filename !== '.gitignore');
      const tmpl2 = tmpl1.filter((e) => !e.filename.endsWith('.md'));

      const source1 = await tmpl1.source();
      const source2 = await tmpl2.source();

      // First level filter:L
      expect(includes(source1.fileMap, '.gitignore')).to.be.false; // NB: first filter.
      expect(includes(source1.fileMap, 'index.md')).to.be.true;

      // Second level filter:
      expect(includes(source2.fileMap, 'index.md')).to.be.false;
      expect(includes(source2.fileMap, 'mod.ts')).to.be.true;
      expect(includes(source2.fileMap, 'deno.json')).to.be.true;
    });

    it('does not copy filtered files', async () => {
      const test = Test.sample1();
      const tmpl = TmplEngine.from(test.source).filter((e) => !e.filename.endsWith('.md'));
      await tmpl.write(test.target);

      const source = await tmpl.source();

      // Sanity check: ensure the source does not contain the filtered value.
      expect(includes(source.fileMap, 'index.md')).to.be.false;

      const targetPaths = await test.ls.target();
      expect(targetPaths.length).to.greaterThan(2);
      expect(includes(targetPaths, '.md')).to.be.false;
    });
  });
});
