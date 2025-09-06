import type { TestingDir } from '@sys/testing/t';
import { type t, Arr, describe, expect, Fs, it, slug, Testing } from '../-test.ts';
import { File } from './mod.ts';

describe('Tmpl.File', () => {
  describe('File.update', () => {
    /**
     * Helpers:
     */
    const getDir = () => Testing.dir('Tmpl.File.update').create();
    const getFile = async (options: { dir?: TestingDir } = {}) => {
      const dir = options.dir ?? (await getDir());
      const path = dir.join(`file-${slug()}.txt`);
      const text = `
        line-1
        line-2
        line-3
      `
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .slice(1);
      await Fs.write(path, text);
      return {
        dir,
        path,
        text,
        async expectFileMatches(res: t.TmplFileUpdateResponse) {
          const text = (await Fs.readText(path)).data;
          expect(text).to.eql(res.after);
        },
      } as const;
    };

    describe('path(s)', () => {
      it('single path', async () => {
        const file = await getFile();
        const fired: string[] = [];
        await File.update(file.path, (e) => fired.push(e.file.path));
        expect(fired.every((p) => p === file.path)).to.be.true;
      });

      it('multiple paths', async () => {
        const dir = await getDir();
        const file1 = await getFile({ dir });
        const file2 = await getFile({ dir });
        expect(file1.path).to.not.eql(file2.path);
        expect(Fs.dirname(file1.path)).to.eql(Fs.dirname(file2.path));

        const paths = [file1, file2].map((f) => f.path);
        const fired: string[] = [];
        await File.update(paths, (e) => fired.push(e.file.path));
        expect(Arr.uniq(fired)).to.have.members(paths);
      });
    });

    describe('File.modify()', () => {
      it('no change', async () => {
        const file = await getFile();
        const a = await File.update(file.path); // NB: no modifier param.
        const b = await File.update(file.path, (line) => null);

        expect(a.changed).to.eql(false);
        expect(b.changed).to.eql(false);

        expect(a.changes).to.eql([]);
        expect(b.changes).to.eql([]);

        expect(a.before).to.eql(file.text);
        expect(b.before).to.eql(file.text);
        expect(a.after).to.eql(file.text);
        expect(b.after).to.eql(file.text);
      });

      it('no change: modify called with same value', async () => {
        const file = await getFile();
        const res = await File.update(file.path, (line) => line.modify(line.text));
        expect(res.changed).to.eql(false);
        expect(res.changes).to.eql([]);
      });

      it('changes lines: sync', async () => {
        const file = await getFile();
        const res = await File.update(file.path, (line) => {
          if (line.text.includes('-2')) line.modify(`${line.text} (🌳)`);
        });

        const lines = res.after.split('\n');
        expect(lines).to.eql(['line-1', 'line-2 (🌳)', 'line-3', '']);
        expect(res.changes.map((m) => m.op)).to.eql(['modify']);
        expect((await Fs.readText(file.path)).data).to.eql(res.after); // NB: changes written to fs.
      });

      it('changes lines: async', async () => {
        const file = await getFile();
        const res = await File.update(file.path, async (line) => {
          await Testing.wait(25);
          if (line.is.first) line.modify('first');
          if (line.is.last) line.modify('last');
        });

        const lines = res.after.split('\n');
        expect(lines).to.eql(['first', 'line-2', 'line-3', 'last', '']); // NB: last line modified to include content, so an additional empty EOF line added.
        expect(res.changes.map((m) => m.op)).to.eql(['modify', 'modify']);
        expect((await Fs.readText(file.path)).data).to.eql(res.after); // NB: changes written to fs.
      });
    });

    describe('File.insert()', () => {
      it('inserts before a middle line (single insert)', async () => {
        const file = await getFile();
        const res = await File.update(file.path, (line) => {
          if (line.text === 'line-2') line.insert('inserted');
        });

        expect(res.after.split('\n')).to.eql(['line-1', 'inserted', 'line-2', 'line-3', '']);
        expect(res.changes.map((m) => m.op)).to.eql(['insert']);
        await file.expectFileMatches(res);
      });

      it('insert before first line', async () => {
        const file = await getFile();
        const res = await File.update(file.path, (line) => {
          if (line.is.first) line.insert('head');
        });

        await file.expectFileMatches(res);

        const lines = res.after.split('\n');
        expect(lines).to.eql(['head', 'line-1', 'line-2', 'line-3', '']);
        expect(res.changes.length).to.eql(1);
        expect(res.changes[0].line.index).to.eql(0);
      });

      it('insert then modify newly-inserted line (no infinite loop)', async () => {
        const file = await getFile();
        const res = await File.update(file.path, (line) => {
          if (line.text === 'line-1') line.insert('head');
          if (line.text === 'line-1') line.modify('my-mod');
        });
        const lines = res.after.split('\n');
        expect(lines).to.eql(['head', 'my-mod', 'line-2', 'line-3', '']);
        expect(res.changes.map((m) => m.op)).to.eql(['insert', 'modify']);
        await file.expectFileMatches(res);
      });

      it('insert two lines', async () => {
        const file = await getFile();
        const res = await File.update(file.path, (line) => {
          if (line.text === 'line-1') line.insert('pre-1');
          if (line.text === 'line-1') line.insert('pre-2');
          if (line.text === 'line-3') line.insert('mid-1');
          if (line.text === 'line-3') line.insert('mid-2');
        });

        expect(res.after.split('\n')).to.eql([
          'pre-1',
          'pre-2',
          'line-1',
          'line-2',
          'mid-1',
          'mid-2',
          'line-3',
          '',
        ]);
        expect(res.changes.map((m) => m.op)).to.eql(Array(4).fill('insert'));
        await file.expectFileMatches(res);
      });

      it('accurately returns of immutable `lines` array after insert', async () => {
        const file = await getFile();
        const lines: (readonly string[])[] = [];
        await File.update(file.path, (line) => {
          if (line.text === 'line-1') {
            lines.push(line.file.lines); // Before.
            lines.push(line.file.lines); // After: same as before
          }
          if (line.text === 'line-2') {
            lines.push(line.file.lines); // Before.
            line.insert('modified!');
            lines.push(line.file.lines); // After: same as before
          }
        });
        expect(lines[0]).to.equal(lines[1]);
        expect(lines[2]).to.not.equal(lines[3]);
        expect(lines[3].length).to.eql(lines[2].length + 1);
      });

      it('insert after', async () => {
        const file = await getFile();
        const res = await File.update(file.path, (line) => {
          if (line.text === 'line-1') line.insert('foo', 'after');
          if (line.text === 'foo') line.insert('bar'); // NB: insert before the other newly inserted line.
        });

        const lines = res.after.split('\n');
        expect(lines).to.eql(['line-1', 'bar', 'foo', 'line-2', 'line-3', '']);
        expect(res.changes.map((m) => m.op)).to.eql(['insert', 'insert']);
        await file.expectFileMatches(res);
      });
    });

    describe('File.delete()', () => {
      it('deletes a line', async () => {
        const file = await getFile();
        const res = await File.update(file.path, (line) => {
          if (line.text === 'line-1') line.delete();
          if (line.text === 'line-2') line.modify('foo-2'); // NB: ensure other operations continue working.
        });
        const lines = res.after.split('\n');
        expect(lines).to.eql(['foo-2', 'line-3', '']);
        expect(res.changes.map((m) => m.op)).to.eql(['delete', 'modify']);
        await file.expectFileMatches(res);
      });

      it('deletes all lines', async () => {
        const file = await getFile();
        const res = await File.update(file.path, (line) => {
          line.delete();
        });
        expect(res.after).to.eql('\n');
        expect(res.changes.map((m) => m.op)).to.eql(Array(4).fill('delete'));
        await file.expectFileMatches(res);
      });
    });

    describe('errors', () => {
      it('error: file does not exist', async () => {
        const path = '/foo/404';
        const res = await File.update(path);
        expect(res.changed).to.eql(false);
        expect(res.changes).to.eql([]);
        expect(res.error?.message).to.include('The given file path does not exist');
        expect(res.error?.message).to.include(path);
      });

      it('error: path not a file', async () => {
        const dir = import.meta.dirname ?? '';
        const res = await File.update(dir);
        expect(res.changed).to.eql(false);
        expect(res.changes).to.eql([]);
        expect(res.error?.message).to.include('The given path is not a file');
        expect(res.error?.message).to.include(dir);
      });
    });
  });
});
