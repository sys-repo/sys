import { type t, describe, expect, Fs, it, pkg, ROOT } from '../-test.ts';
import { Vite } from '../mod.ts';
import { Plugin } from './mod.ts';

describe('Vite.Plugin.workspace', () => {
  it('API', () => {
    expect(Vite.Plugin).to.equal(Plugin);
  });

  describe('Plugin.workspace', () => {
    describe('create', () => {
      const wsDirs = ROOT.denofile.json.workspace.map((p) => p.replace(/^\.\//, '')).toSorted();

      it('default (no params)', async () => {
        const plugin = await Vite.Plugin.workspace();
        expect(plugin.name).to.eql('vite-plugin-workspace');
        expect(plugin.info.ws?.children.map((m) => Fs.dirname(m.path)).toSorted()).to.eql(wsDirs);
      });

      it('{ pkg }', async () => {
        const plugin = await Vite.Plugin.workspace({ pkg });
        expect(plugin.info.pkg).to.eql(pkg);
      });

      it('param: workspace (explicit path)', async () => {
        const workspace = ROOT.denofile.path;
        const plugin = await Vite.Plugin.workspace({ workspace });
        expect(plugin.info.ws?.children.map((m) => Fs.dirname(m.path)).toSorted()).to.eql(wsDirs);
      });

      it('param: filter param', async () => {
        const filter: t.WorkspaceFilter = (e) => e.subpath.startsWith('/client');
        const plugin = await Vite.Plugin.workspace(filter);
        expect(plugin.info.ws?.filter).to.equal(filter);
      });

      it('throw: workspace not found', async () => {
        const workspace = '/404.json';
        let count = 0;
        try {
          await Vite.Plugin.workspace({ workspace });
        } catch (error: any) {
          count++;
          expect(error.message).to.include('A workspace could not be found');
          expect(error.message).to.include(workspace);
        }
      });
    });
  });
});
