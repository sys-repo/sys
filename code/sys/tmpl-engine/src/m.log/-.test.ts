import { describe, expect, it } from '../-test.ts';

import { type t, Fs, Path } from '../common.ts';
import { Log } from './mod.ts';

describe('Tmpl.Log', () => {
  it('API', () => {
    expect(typeof Log.table).to.eql('function');
  });

  it('empty ops → friendly message, respects indent', () => {
    const out0 = Log.table([], {});
    expect(out0.toLowerCase()).to.include('no items');

    const out2 = Log.table([], { indent: 2 });
    // 2-space indent should prefix the message (allowing for ANSI)
    expect(out2.replace(/\x1b\[[0-9;]*m/g, '')).to.match(/^\s{2}/);
  });

  it('normalizes FileMap ops (baseDir + trimPathLeft)', () => {
    // Use the same absolute base for normalization and trimming.
    const base = Fs.toDir(Path.resolve('/tmp/log-table-base')) as t.FsDir;

    const ops: t.FileMapMaterializeOp[] = [
      { kind: 'write', path: 'x/y.txt' },
      { kind: 'modify', path: 'x/z.md' },
      { kind: 'skip', path: 'x/w.bin' },
    ];

    const out = Log.table(ops as any, {
      baseDir: base.absolute,
      trimPathLeft: base.absolute,
    });

    const cleaned = out.replace(/\x1b\[[0-9;]*m/g, '');

    // Renderer currently shows basenames only:
    expect(cleaned).to.include('y.txt');
    expect(cleaned).to.include('z.md');
    expect(cleaned).to.include('w.bin'); // skip appears when hideExcluded is false (default)
  });

  it('hideExcluded=true filters skip ops', () => {
    const base = Fs.toDir(Path.resolve('/tmp/log-table-base-2')) as t.FsDir;
    const ops: t.FileMapMaterializeOp[] = [
      { kind: 'write', path: 'a.txt' },
      { kind: 'skip', path: 'b.txt' },
      { kind: 'modify', path: 'c.txt' },
    ];

    const out = Log.table(ops as any, {
      baseDir: base.absolute,
      trimPathLeft: base.absolute,
      hideExcluded: true,
    });

    const cleaned = out.replace(/\x1b\[[0-9;]*m/g, '');
    expect(cleaned).to.include('a.txt');
    expect(cleaned).to.include('c.txt');
    expect(cleaned).not.to.include('b.txt');
  });

  it('indent adds left padding', () => {
    const base = Fs.toDir(Path.resolve('/tmp/log-table-indent')) as t.FsDir;
    const ops: t.FileMapMaterializeOp[] = [{ kind: 'write', path: 'p/q.txt' }];

    const out = Log.table(ops as any, {
      baseDir: base.absolute,
      trimPathLeft: base.absolute,
      indent: 4,
    });

    const noAnsi = out.replace(/\x1b\[[0-9;]*m/g, '');

    // The action cell is prefixed with spaces – assert at least one line starts with 4 spaces
    expect(noAnsi.split('\n').some((l) => /^ {4}\S/.test(l))).to.eql(true);

    // Renderer shows only the basename, not the full relative path.
    expect(noAnsi).to.include('q.txt');
  });

  it('rename renders without throwing (best-effort note)', () => {
    const ops: t.FileMapMaterializeOp[] = [{ kind: 'rename', from: 'old.ts', to: 'new.ts' }];
    const out = Log.table(ops as any, {});

    // Destination should always be shown:
    expect(out).to.include('new.ts');

    // The action label exists (don't couple to exact wording/color):
    const noAnsi = out.replace(/\x1b\[[0-9;]*m/g, '');
    expect(noAnsi).to.match(/Created|Updated|Renamed|Unchanged|Excluded/);
  });

  it('TmplFileOperation passthrough (no normalization)', () => {
    const base = Fs.toDir(Path.resolve('/tmp/log-table-direct')) as t.FsDir;
    const abs = Path.join(base.absolute, 'direct.txt') as t.StringPath;

    // Minimal shape the renderer actually uses; cast to the union for the test.
    const op = {
      file: { tmpl: Fs.toFile(abs), target: Fs.toFile(abs) },
      written: true,
      updated: false,
      excluded: false,
      forced: false,
      created: true,
    } as unknown as t.TmplFileOperation;

    const out = Log.table([op], { trimPathLeft: base.absolute });
    const cleaned = out.replace(/\x1b\[[0-9;]*m/g, '');
    expect(cleaned).to.include('direct.txt');
    expect(cleaned).to.match(/Created|Updated|Renamed|Unchanged|Excluded/);
  });
});
