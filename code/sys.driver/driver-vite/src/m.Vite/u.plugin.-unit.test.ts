import { describe, expect, it, ROOT, type t } from '../-test.ts';
import { Vite } from './mod.ts';

describe('ViteProcess.workspacePlugin', () => {
  describe('create', () => {
    it('default (no params)', async () => {
      const plugin = await Vite.workspacePlugin();
      expect(plugin.name).to.eql('vite-plugin-workspace');
      expect(plugin.ws?.children.paths).to.eql(ROOT.denofile.json.workspace);
    });

    it('param: workspace (explicit path)', async () => {
      const workspace = ROOT.denofile.path;
      const plugin = await Vite.workspacePlugin({ workspace });
      expect(plugin.ws?.children.paths).to.eql(ROOT.denofile.json.workspace);
    });

    it('param: filter param', async () => {
      const filter: t.WorkspaceFilter = (e) => e.subpath.startsWith('/client');
      const plugin = await Vite.workspacePlugin(filter);
      expect(plugin.ws?.filter).to.equal(filter);
    });

    it('throw: workspace not found', async () => {
      const workspace = '/404.json';
      let count = 0;
      try {
        await Vite.workspacePlugin({ workspace });
      } catch (error: any) {
        count++;
        expect(error.message).to.include('A workspace could not be found');
        expect(error.message).to.include(workspace);
      }
    });
  });
});
