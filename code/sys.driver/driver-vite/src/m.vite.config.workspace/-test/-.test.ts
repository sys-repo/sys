import { c, describe, expect, Fs, it, Json, ROOT, stripAnsi, type t } from '../../-test.ts';
import { ViteConfig } from '../../m.vite.config/mod.ts';
import { workspace } from '../mod.ts';
import { Log } from '../u.log.ts';

const PRIMARY_SPECIFIER = '@sys/tmpl/testing';
const PRIMARY_PATH = './code/-tmpl/src/m.testing/mod.ts';

describe('ViteConfig.workspace', () => {
  it('API', () => {
    expect(ViteConfig.workspace).to.equal(workspace);
  });

  it('loads (via path)', async () => {
    const map = (children: t.DenoFile.Workspace.Child[]) => children.map((m) => m.path.dir);

    const a = await workspace(); // NB: finds root workspace
    const b = await workspace({ denofile: ROOT.denofile.path });
    const c = await workspace({ walkup: false });

    expect(a.exists).to.eql(true);
    expect(b.exists).to.eql(true);
    expect(map(a.children).includes('code/sys/std')).to.eql(true);
    expect(map(a.children)).to.eql(map(b.children));
    expect(c.exists).to.eql(false); // NB: did not walk up to the root workspace `deno.json`
    expect(c.error).to.eql('Workspace not found (walkup=false).');
  });

  describe('formatting', () => {
    it('renders only load-bearing mapping punctuation and color', () => {
      const raw = Log.toString(workspaceFixture(), { width: 100 });
      const text = stripAnsi(raw);
      const title = titleLine(text);
      const header = headerLine(text);
      const rows = mappingRows(text);
      const rawPrimaryRow =
        raw.split('\n').find((line) => stripAnsi(line).includes(PRIMARY_PATH)) ?? '';

      expect(title).to.include('Workspace <ESM Module> import-map');
      expect(title).to.not.include(':');
      expect(header).to.include('Export');
      expect(header).to.include('Maps to');
      expect(header).to.not.include(':');
      expect(header).to.not.include('→');
      expect(rows[0]).to.include(`import ${PRIMARY_SPECIFIER}`);
      expect(rows[0]).to.include('  →  ');
      expect(arrowColumns(rows).size).to.eql(1);
      expect(rawPrimaryRow).to.include(c.green('→'));
      expect(rawPrimaryRow).to.include(c.gray(PRIMARY_PATH));
      expect(rawPrimaryRow).to.not.include(c.dim(c.gray(PRIMARY_PATH)));
    });

    it('keeps filtered status without restoring title punctuation', () => {
      const text = stripAnsi(Log.toString(workspaceFixture({ filtered: true }), { width: 100 }));

      const title = titleLine(text);

      expect(title).to.include('(filtered)');
      expect(title).to.not.include(':');
    });

    it('keeps standalone workspace log rows bounded at narrow widths', () => {
      const width = 20;
      const raw = Log.toString(workspaceFixture(), { width });

      expectRowsBounded(raw, width);
      expect(stripAnsi(raw)).to.include('…');
    });

    it('drops the import prefix globally before clipping values', () => {
      const width = 60;
      const raw = Log.toString(workspaceFixture(), { width });
      const text = stripAnsi(raw);
      const rows = mappingRows(text);

      expectRowsBounded(raw, width);
      expect(rows.length).to.eql(2);
      expect(rows.every((line) => !line.includes('import '))).to.eql(true);
      expect(rows.every((line) => line.includes('  →  '))).to.eql(true);
      expect(rows.every((line) => !line.includes('…'))).to.eql(true);
      expect(arrowColumns(rows).size).to.eql(1);
      expect(rows[0]).to.include(PRIMARY_SPECIFIER);
      expect(rows[0]).to.include(PRIMARY_PATH);
    });

    it('clips module specifiers and paths around a compact arrow seam', () => {
      const width = 38;
      const raw = Log.toString(workspaceFixture(), { width });
      const text = stripAnsi(raw);
      const rows = mappingRows(text);
      const first = rows[0] ?? '';
      const [left, right] = first.split('→');

      expectRowsBounded(raw, width);
      expect(rows.length).to.eql(2);
      expect(rows.every((line) => !line.includes('import '))).to.eql(true);
      expect(rows.every((line) => line.includes('  →  '))).to.eql(true);
      expect(arrowColumns(rows).size).to.eql(1);
      expect(left).to.include('…');
      expect(right).to.include('…');
      expect(right).to.include('.ts');
      expect(raw).to.include(c.dim(c.gray('…')));
      expect(raw).not.to.include(c.cyan('…'));
    });
  });

  describe('resolution {aliases}', () => {
    it('generate {aliases} list', async () => {
      const ws = await workspace();
      const map = ws.toAliasMap();
      const lookup = {
        key: '@sys/std/args',
        path: ROOT.resolve('./code/sys/std/src/m.Args/mod.ts'),
      };

      const match = ws.aliases.find((item) => item.find === lookup.key);
      expect(match?.replacement).to.eql(lookup.path);
      expect(map[lookup.key]).to.eql(lookup.path);
    });

    it('filter {aliases} list', async () => {
      const ws = await workspace({ filter: (e) => e.subpath.includes('/client') });
      const includesClient = (input: string) => input.includes('/client');
      const isOnlyClients = ws.aliases.every((item) => includesClient(String(item.find)));
      expect(isOnlyClients).to.eql(true);
    });

    it('loads from jsonc workspace file', async () => {
      const fs = await Fs.makeTempDir({ prefix: 'ViteConfig.workspace.jsonc.' });
      const root = fs.absolute;
      const childDir = Fs.join(root, 'pkg-a');
      const childSrc = Fs.join(childDir, 'src');

      await Fs.ensureDir(childSrc);
      await Fs.write(Fs.join(childSrc, 'mod.ts'), 'export const ok = true;');
      await Fs.write(
        Fs.join(childDir, 'deno.json'),
        Json.stringify(
          {
            name: '@sys/pkg-a',
            version: '0.0.0',
            exports: {
              './mod': './src/mod.ts',
            },
          },
          2,
        ),
      );
      await Fs.write(
        Fs.join(root, 'deno.jsonc'),
        `{
          // comment
          "name": "root",
          "version": "0.0.0",
          "workspace": ["pkg-a"]
        }`,
      );

      const ws = await workspace({ denofile: Fs.join(root, 'deno.jsonc'), walkup: false });
      const match = ws.aliases.find((item) => item.find === '@sys/pkg-a/mod');
      expect(ws.exists).to.eql(true);
      expect(match?.replacement).to.eql(Fs.join(childDir, 'src/mod.ts'));

      await Fs.remove(root);
    });

    it('all files exist', async () => {
      const ws = await workspace();
      for (const alias of ws.aliases) {
        const exists = await Fs.exists(alias.replacement);
        expect(exists).to.eql(true, alias.replacement);
      }
    });
  });
});

function expectRowsBounded(text: string, width: number) {
  stripAnsi(text).split('\n').forEach((line) => expect(line.length <= width).to.eql(true));
}

function titleLine(text: string) {
  return text.split('\n').find((line) => line.includes('Workspace <ESM Module>')) ?? '';
}

function headerLine(text: string) {
  return text.split('\n').find((line) => line.includes('Export')) ?? '';
}

function mappingRows(text: string) {
  return text.split('\n').filter((line) => line.includes('→') && line.includes('@sys/'));
}

function arrowColumns(rows: readonly string[]) {
  return new Set(rows.map((line) => line.indexOf('→')));
}

function workspaceFixture(options: { filtered?: boolean } = {}): t.ViteDenoWorkspace {
  type EsmImportMap = { readonly [key: string]: string };
  function latest(name: t.StringModuleSpecifier): t.StringSemver;
  function latest(deps: EsmImportMap): EsmImportMap;
  function latest(input: t.StringModuleSpecifier | EsmImportMap): t.StringSemver | EsmImportMap {
    return typeof input === 'string' ? '0.0.0' : input;
  }

  const ws = {
    exists: true,
    dir: '/repo',
    file: '/repo/deno.json',
    children: [],
    modules: { ok: true, items: [], count: 0, latest },
    aliases: [
      { find: PRIMARY_SPECIFIER, replacement: `/repo/${PRIMARY_PATH.replace(/^\.\//, '')}` },
      { find: '@sys/tmpl/types', replacement: '/repo/code/-tmpl/src/types.ts' },
    ],
    filter: options.filtered ? (() => true) : undefined,
    toAliasMap: () => ({}),
    toString(options?: { pad?: boolean; width?: number }) {
      return Log.toString(this, options);
    },
    log() {},
  } satisfies t.ViteDenoWorkspace;

  return ws;
}
