import { describe, expect, it, ROOT } from '../-test.ts';
import { Vite } from './mod.ts';

describe('ViteProcess.workspacePlugin', () => {
  describe('create', () => {
    it('default (no params)', async () => {
      const plugin = await Vite.workspacePlugin();
      expect(plugin.name).to.eql('vite-plugin-workspace');
      expect(plugin.workspace.paths).to.eql(ROOT.denofile.json.workspace);
    });

    it('param: workspace (explicit path)', async () => {
      const workspace = ROOT.denofile.path;
      const plugin = await Vite.workspacePlugin({ workspace });
      expect(plugin.workspace.paths).to.eql(ROOT.denofile.json.workspace);
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
