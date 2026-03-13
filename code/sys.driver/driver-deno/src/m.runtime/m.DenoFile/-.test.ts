import type { TestingDir } from '@sys/testing/t';
import { type t, c, describe, expect, Fs, it, pkg, slug, Testing } from '../../-test.ts';
import { DenoFile } from './mod.ts';

describe('DenoFile', () => {
  const rootPath = Fs.resolve('../../../deno.json');

  describe('DenoFile.load', () => {
    it('path exists', async () => {
      const path = Fs.resolve('./deno.json');
      const res = await DenoFile.load(path);
      expect(res.exists).to.eql(true);
      expect(res.data?.name).to.eql('@sys/driver-deno');
      expect(res.data?.version).to.eql(pkg.version);
    });

    it('path <undefined> ← default to root of [cwd]', async () => {
      const res = await DenoFile.load();
      expect(res.exists).to.eql(true);
      expect(res.data?.name).to.eql('@sys/driver-deno');
      expect(res.data?.version).to.eql(pkg.version);
    });

    it('appends <deno.json> to path if directory is given', async () => {
      const path1 = Fs.resolve('.');
      const path2 = Fs.resolve('./src');
      expect(await Fs.Is.dir(path1)).to.eql(true);
      expect(await Fs.Is.dir(path2)).to.eql(true);

      const res1 = await DenoFile.load(path1);
      const res2 = await DenoFile.load(path2);
      expect(res1.exists).to.eql(true);
      expect(res2.exists).to.eql(false);
    });

    it('not found', async () => {
      const res = await DenoFile.load('./404.json');
      expect(res.exists).to.eql(false);
    });

    it('supports deno.jsonc', async () => {
      const fs = await Testing.dir('DenoFile.load.jsonc');
      const jsonc = `{
        // comment
        "name": "jsonc-module",
        "version": "0.1.0"
      }`;

      const file = fs.join('deno.jsonc');
      await Fs.write(file, jsonc);

      const resFile = await DenoFile.load(file);
      expect(resFile.exists).to.eql(true);
      expect(resFile.data?.name).to.eql('jsonc-module');

      const resDir = await DenoFile.load(fs.dir);
      expect(resDir.exists).to.eql(true);
      expect(resDir.data?.name).to.eql('jsonc-module');
    });
  });

  describe('DenoFile.Is', () => {
    const Is = DenoFile.Is;

    describe('Is.workspace', () => {
      it('true', async () => {
        expect(await Is.workspace(rootPath)).to.eql(true);
      });

      it('false', async () => {
        expect(await Is.workspace(undefined)).to.eql(false);
        expect(await Is.workspace('./404.json')).to.eql(false);
        expect(await Is.workspace('./deno.json')).to.eql(false);
      });
    });
  });

  describe('DenoFile.nearest (ancestor)', () => {
    const getDir = () => Testing.dir('DenoFile.nearest');
    const setup = async (options: { fs?: TestingDir } = {}) => {
      const fs = options.fs || (await getDir());
      const version = '0.0.0';
      await Fs.writeJson(fs.join('deno.json'), { name: 'root', version, workspace: [] });
      await Fs.write(fs.join('src/foo/bar/baz.txt'), 'baz');
      await Fs.writeJson(fs.join('src/foo/deno.json'), { name: 'foo', version });
      return fs;
    };

    it('print object:', async () => {
      const fs = await setup();

      const a = await DenoFile.nearest(Fs.join(fs.dir, 'src/foo/'));
      const b = await DenoFile.nearest(fs.dir, (e) => Array.isArray(e.file.workspace));

      console.info();
      console.info(c.bold(c.brightCyan('T:DenoFileNearestResult')));
      console.info();
      console.info(c.green('path:'), Fs.trimCwd(a?.path ?? ''));
      console.info(a);
      console.info();
      console.info(c.green('path:'), Fs.trimCwd(b?.path ?? ''));
      console.info(b);
      console.info();
    });

    it('finds nearest file', async () => {
      const fs = await setup();
      const test = async (
        start: t.StringPath,
        expected?: t.StringPath,
        workspace?: boolean,
        shouldStop?: t.DenoFileNearestStop,
      ) => {
        start = fs.join(start);
        if (typeof expected === 'string') expected = fs.join(expected);
        const res = await DenoFile.nearest(start, shouldStop);

        if (expected === undefined) {
          expect(res).to.eql(undefined);
        } else {
          expect(res?.path).to.eql(expected);
          expect(Array.isArray(res?.file.workspace)).to.eql(workspace);
        }
      };

      await test('src/foo', 'src/foo/deno.json', false, undefined);
      await test('src/foo', 'deno.json', true, (e) => Array.isArray(e.file.workspace));
      await test('src/foo/deno.json', 'deno.json', true, (e) => Array.isArray(e.file.workspace));
      await test('src/foo/deno.json', undefined, false, (e) => false);
    });

    describe('Path.nearest', () => {
      it('not found', async () => {
        const noExist = Fs.resolve('/', slug());
        const res = await DenoFile.Path.nearest(noExist);
        expect(res).to.eql(undefined);
      });

      it('finds nearest', async () => {
        const fs = await setup();
        const test = async (start: t.StringPath, expected?: t.StringPath) => {
          start = fs.join(start);
          if (typeof expected === 'string') expected = fs.join(expected);
          const res = await DenoFile.Path.nearest(start);
          expect(res).to.eql(expected);
        };

        await test('src/foo/bar/baz.txt', 'src/foo/deno.json');
        await test('src/foo/bar/', 'src/foo/deno.json');
        await test('src/foo', 'src/foo/deno.json');
        await test('src/foo/deno.json', 'src/foo/deno.json');
        await test('src/', 'deno.json');
        await test('.', 'deno.json');
      });

      it('finds deno.jsonc when deno.json is missing', async () => {
        const fs = await Testing.dir('DenoFile.nearest.jsonc');
        await Fs.write(
          fs.join('deno.jsonc'),
          `{
            // comment
            "name": "jsonc-root",
            "version": "0.0.0"
          }`,
        );
        await Fs.write(fs.join('src/foo/bar/baz.txt'), 'baz');

        const res = await DenoFile.Path.nearest(fs.join('src/foo/bar/baz.txt'));
        expect(res).to.eql(fs.join('deno.jsonc'));
      });

      it('skips nearest match via `shouldStop` parameter', async () => {
        const fs = await setup();
        const test = async (
          start: t.StringPath,
          expected?: t.StringPath,
          shouldStop?: t.DenoFileNearestStop,
        ) => {
          start = fs.join(start);
          if (typeof expected === 'string') expected = fs.join(expected);
          const res = await DenoFile.Path.nearest(start, shouldStop);
          expect(res).to.eql(expected);
        };

        await test('src/foo', 'src/foo/deno.json', undefined);
        await test('src/foo', 'deno.json', (e) => Array.isArray(e.file.workspace));
        await test('src/foo/deno.json', 'deno.json', (e) => Array.isArray(e.file.workspace));
        await test('src/foo/deno.json', undefined, (e) => false);
      });
    });
  });

  describe('DenoFile.workspace', () => {
    describe('path', () => {
      it('from path: exists', async () => {
        const res = await DenoFile.workspace(rootPath);
        const dirs = res.children.map((child) => child.path.dir);
        expect(res.exists).to.eql(true);
        expect(dirs.some((p) => p === 'code/sys/std')).to.be.true;
        expect(res.file).to.eql(rootPath);
        expect(res.dir).to.eql(Fs.dirname(rootPath));
      });

      it('from path: <undefined>  ←  (↑ first-ancestor-workspace ↑)  ←  ./deno.json', async () => {
        const root = await Fs.readJson<t.DenoFileJson>(rootPath);
        const a = await DenoFile.workspace();
        const b = await DenoFile.workspace(undefined, { walkup: false });
        const dirs = root.data?.workspace?.map((p) => p.replace(/^\.\//, ''));

        expect(a.exists).to.eql(true);
        expect(a.children.map((m) => m.path.dir)).to.eql(dirs);

        expect(b.exists).to.eql(false);
        expect(b.children).to.eql([]);
      });

      it('from path: not found', async () => {
        const res = await DenoFile.workspace('./404.json');
        expect(res.exists).to.eql(false);
        expect(res.children).to.eql([]);
      });

      it('from path: jsonc', async () => {
        const fs = await Testing.dir('DenoFile.workspace.jsonc');
        await Fs.write(
          fs.join('deno.jsonc'),
          `{
            // comment
            "name": "jsonc-root",
            "version": "0.0.0",
            "workspace": []
          }`,
        );

        const res = await DenoFile.workspace(fs.join('deno.jsonc'));
        expect(res.exists).to.eql(true);
        expect(res.children).to.eql([]);
      });
    });

    describe('workspace.children', () => {
      it('child.path', async () => {
        const ws = await DenoFile.workspace();
        const dirs = ws.children.map((child) => child.path.dir);
        const paths = dirs.map((subdir) => Fs.join('./', subdir, 'deno.json'));
        ws.children.forEach((child) => {
          expect(paths.includes(child.path.denofile)).to.eql(true);
        });
      });

      it('child.pkg', async () => {
        const ws = await DenoFile.workspace();
        const match = ws.children.find((m) => m.denofile.name === pkg.name);

        expect(match).to.exist;
        expect(match?.pkg).to.eql(pkg);
        expect(match?.denofile.name).to.eql(pkg.name);
        expect(match?.denofile.version).to.eql(pkg.version);

        ws.children.forEach((child) => {
          expect(child.pkg.name).to.eql(child.denofile.name || '<unnamed>');
          expect(child.pkg.version).to.eql(child.denofile.version || '0.0.0');
        });
      });
    });

    describe('workspace.modules', () => {
      it('includes all modules from the workspace.', async () => {
        const ws = await DenoFile.workspace();
        expect(ws.modules.ok).to.eql(true);
        expect(ws.modules.error).to.eql(undefined);

        const namesA = ws.children.map((m) => m.denofile.name ?? '');
        const namesB = ws.modules.items.map((m) => m.name);
        expect(namesA.filter(Boolean).toSorted()).to.eql(namesB.filter(Boolean).toSorted());
      });

      it('empty workspace → no modules', async () => {
        const ws = await DenoFile.workspace('./src/-test/sample-2/deno-empty-workspace.json');
        const modules = ws.modules;
        expect(modules.ok).to.eql(true);
        expect(modules.count).to.eql(0);
        expect(modules.items).to.eql([]);
      });
    });

    describe('workspaceVersion', () => {
      it('returns the package version for a named workspace child', async () => {
        const ws = await DenoFile.workspace(rootPath);
        const child = ws.children.find((m) => m.pkg.name === '@sys/tmpl');
        const res = await DenoFile.workspaceVersion('@sys/tmpl', rootPath);

        expect(child).to.exist;
        expect(typeof child?.pkg.version).to.eql('string');
        expect(res).to.eql(child?.pkg.version);
      });

      it('returns undefined when the package is not present in the workspace', async () => {
        const res = await DenoFile.workspaceVersion('@sys/404', rootPath);
        expect(res).to.eql(undefined);
      });
    });
  });
});
