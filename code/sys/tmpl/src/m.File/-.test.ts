import { describe, expect, Fs, it, Testing } from '../-test.ts';
import { File } from './mod.ts';

describe('Tmpl.File', () => {
  describe('File.update', () => {
    const getDir = () => Testing.dir('Tmpl.File.update').create();
    const getFile = async () => {
      const dir = await getDir();
      const path = dir.join('file.txt');
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
      return { dir, path, text } as const;
    };

    describe('changing', () => {
      it('no change', async () => {
        const file = await getFile();
        const a = await File.update(file.path); // NB: no modifier param.
        const b = await File.update(file.path, (e) => null);

        expect(a.changed).to.eql(false);
        expect(b.changed).to.eql(false);

        expect(a.changes).to.eql([]);
        expect(b.changes).to.eql([]);

        expect(a.before).to.eql(file.text);
        expect(b.before).to.eql(file.text);
        expect(a.after).to.eql(file.text);
        expect(b.after).to.eql(file.text);
      });

      it('changes lines: sync', async () => {
        const file = await getFile();

        const res = await File.update(file.path, (e) => {
          if (e.line.text.includes('-2')) e.modify(`${e.line.text} (🌳)`);
          if (e.is.last) e.modify('last');
        });

        const lines = res.after.split('\n');
        expect(lines[0]).to.eql('line-1');
        expect(lines[1]).to.eql('line-2 (🌳)');
        expect(lines[2]).to.eql('last');
        expect(res.after.endsWith('\n')).to.eql(true);

        const text = (await Fs.readText(file.path)).data;
        expect(text).to.eql(res.after);
      });

      it('changes lines: async', async () => {
        const file = await getFile();

        const res = await File.update(file.path, async (e) => {
          await Testing.wait(50);
          if (e.is.first) e.modify('first');
          if (e.is.last) e.modify('last');
        });

        const lines = res.after.split('\n');
        expect(lines[0]).to.eql('first');
        expect(lines[2]).to.eql('last');
        expect(res.after.endsWith('\n')).to.eql(true);

        const text = (await Fs.readText(file.path)).data;
        expect(text).to.eql(res.after);
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
