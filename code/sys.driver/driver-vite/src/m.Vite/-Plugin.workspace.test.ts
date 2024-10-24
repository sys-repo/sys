import { describe, expect, it, ROOT, type t } from '../-test.ts';
import { Vite } from './mod.ts';

describe('Vite.Plugin.workspace', () => {
  describe('create', () => {
    it('default (no params)', async () => {
      const plugin = await Vite.Plugin.workspace();
      expect(plugin.name).to.eql('vite-plugin-workspace');
      expect(plugin.info.ws?.children.dirs).to.eql(ROOT.denofile.json.workspace);
    });

    it('param: workspace (explicit path)', async () => {
      const workspace = ROOT.denofile.path;
      const plugin = await Vite.Plugin.workspace({ workspace });
      expect(plugin.info.ws?.children.dirs).to.eql(ROOT.denofile.json.workspace);
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
