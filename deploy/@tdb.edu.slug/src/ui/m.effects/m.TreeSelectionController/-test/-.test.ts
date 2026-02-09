import { describe, expect, it } from '../../../../-test.ts';
import { TreeSelectionController } from '../mod.ts';
import { sampleTree } from './u.fixture.ts';

describe('TreeSelectionController', () => {
  describe('lifecycle transitions', () => {
    it('creates controller with intent/view methods', () => {
      const ctrl = TreeSelectionController.create();
      expect(ctrl.id).to.include('tree-effect-');
      expect(typeof ctrl.intent).to.eql('function');
      expect(typeof ctrl.view).to.eql('function');
      ctrl.dispose();
    });

    it('tree.clear and reset enforce empty invariant', () => {
      const ctrl = TreeSelectionController.create();
      ctrl.intent({ type: 'tree.set', tree: sampleTree() });
      ctrl.intent({ type: 'ref.request', ref: 'ref-a' });

      ctrl.intent({ type: 'tree.clear' });
      let state = ctrl.current();
      expect(state.tree).to.eql(undefined);
      expect(state.selectedPath).to.eql(undefined);
      expect(state.selectedRef).to.eql(undefined);

      ctrl.intent({ type: 'tree.set', tree: sampleTree() });
      ctrl.intent({ type: 'reset' });
      state = ctrl.current();
      expect(state.tree).to.eql(undefined);
      expect(state.selectedPath).to.eql(undefined);
      expect(state.selectedRef).to.eql(undefined);
      ctrl.dispose();
    });
  });

  describe('selection resolution and invariants', () => {
    it('tree.set + path.request resolves selected ref', () => {
      const ctrl = TreeSelectionController.create();
      const tree = sampleTree();
      ctrl.intent({ type: 'tree.set', tree });
      ctrl.intent({ type: 'path.request', path: ['a', 'b'] });

      const state = ctrl.current();
      expect(state.selectedPath).to.eql(['a', 'b']);
      expect(state.selectedRef).to.eql('ref-b');
      expect(ctrl.view().selection.ref).to.eql('ref-b');
      ctrl.dispose();
    });

    it('ref.request resolves selected path', () => {
      const ctrl = TreeSelectionController.create();
      const tree = sampleTree();
      ctrl.intent({ type: 'tree.set', tree });
      ctrl.intent({ type: 'ref.request', ref: 'ref-a' });

      const state = ctrl.current();
      expect(state.selectedPath).to.eql(['a']);
      expect(state.selectedRef).to.eql('ref-a');
      expect(ctrl.view().treeHost.selectedPath).to.eql(['a']);
      ctrl.dispose();
    });

    it('does not clear selectedPath when ref is cleared', () => {
      const ctrl = TreeSelectionController.create();
      const tree = sampleTree();
      ctrl.intent({ type: 'tree.set', tree });
      ctrl.intent({ type: 'path.request', path: ['a', 'b'] });
      ctrl.intent({ type: 'ref.request', ref: undefined });

      const state = ctrl.current();
      expect(state.selectedPath).to.eql(['a', 'b']);
      expect(state.selectedRef).to.eql('ref-b');
      ctrl.dispose();
    });
  });
});
