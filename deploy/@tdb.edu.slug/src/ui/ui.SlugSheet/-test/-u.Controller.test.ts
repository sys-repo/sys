import { describe, expect, it, SAMPLES } from '../../../-test.ts';
import { TreeHost } from '../../ui.TreeHost/-spec/mod.ts';
import { SlugSheet } from '../mod.ts';

describe('SlugSheet.Controller', () => {
  it('exposes stable props and reflects selection changes', () => {
    const root = TreeHost.Data.fromSlugTree(SAMPLES.SlugTree.gHcQi);
    const controller = SlugSheet.Controller.create({ root });

    const first = controller.props();
    expect(first.slots?.tree).to.exist;

    controller.selectedPath.value = ['a'];
    expect(controller.selectedPath.value).to.eql(['a']);

    const next = controller.props();
    expect(next.slots?.tree).to.exist;

    const viewModel = controller.model();
    expect(viewModel.treeHostProps.slots?.main).to.exist;

    controller.dispose();
  });
});
