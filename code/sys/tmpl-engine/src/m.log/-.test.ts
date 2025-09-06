import { describe, expect, it, stripAnsi } from '../-test.ts';

import { type t, Fs, Path } from '../common.ts';
import { Log } from './mod.ts';
import { bundled } from './u.bundled.ts';
import { table } from './u.table.ts';

describe('Tmpl.Log', () => {
  it('API', () => {
    expect(Log.table).to.equal(table);
    expect(Log.bundled).to.equal(bundled);
  });

  it('empty ops → friendly message, respects indent', () => {
    const out1 = Log.table([], {});
    expect(out1.toLowerCase()).to.include('no items');

    const out2 = Log.table([], { indent: 2 });
    // 2-space indent should prefix the message (allowing for ANSI)
    expect(out2.replace(/\x1b\[[0-9;]*m/g, '')).to.match(/^\s{2}/);
  });

  it('normalizes FileMap ops (baseDir + trimPathLeft)', () => {
    // Use the same absolute base for normalization and trimming.
    const base = Fs.toDir(Path.resolve('/tmp/log-table-base')) as t.FsDir;

    const ops: t.FileMapOp[] = [
      { kind: 'create', path: 'x/y.txt' },
      { kind: 'modify', path: 'x/z.md' },
      { kind: 'skip', path: 'x/w.bin' },
    ];

    const out = Log.table(ops as any, {
      baseDir: base.absolute,
      trimPathLeft: base.absolute,
    });

    // Renderer currently shows basenames only:
    const cleaned = stripAnsi(out);
    expect(cleaned).to.include('y.txt');
    expect(cleaned).to.include('z.md');
    expect(cleaned).to.include('w.bin'); // skip appears when hideExcluded is false (default)
  });

  it('hideExcluded=true filters skip ops', () => {
    const base = Fs.toDir(Path.resolve('/tmp/log-table-base-2')) as t.FsDir;
    const ops: t.FileMapOp[] = [
      { kind: 'create', path: 'a.txt' },
      { kind: 'skip', path: 'b.txt' },
      { kind: 'modify', path: 'c.txt' },
    ];

    const out = Log.table(ops as any, {
      baseDir: base.absolute,
      trimPathLeft: base.absolute,
      hideExcluded: true,
    });

    const cleaned = stripAnsi(out);
    expect(cleaned).to.include('a.txt');
    expect(cleaned).to.include('c.txt');
    expect(cleaned).to.include('b.txt   ← skipped');
  });

  it('indent adds left padding', () => {
    const base = Fs.toDir(Path.resolve('/tmp/log-table-indent')) as t.FsDir;
    const ops: t.FileMapOp[] = [{ kind: 'create', path: 'p/q.txt' }];

    const out = Log.table(ops as any, {
      baseDir: base.absolute,
      trimPathLeft: base.absolute,
      indent: 4,
    });

    // The action cell is prefixed with spaces – assert at least one line starts with 4 spaces
    const noAnsi = stripAnsi(out);
    expect(noAnsi.split('\n').some((l) => /^ {4}\S/.test(l))).to.eql(true);

    // Renderer shows only the basename, not the full relative path.
    expect(noAnsi).to.include('q.txt');
  });
});
