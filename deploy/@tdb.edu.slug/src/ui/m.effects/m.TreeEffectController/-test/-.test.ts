import { describe, expect, it } from '../../../../-test.ts';
import { Controller } from '../mod.ts';
import { type t } from '../common.ts';

describe('TreeEffectController', () => {
  it('creates controller with input/view methods', () => {
    const ctrl = Controller.create();
    expect(ctrl.id).to.include('tree-effect-');
    expect(typeof ctrl.input).to.eql('function');
    expect(typeof ctrl.view).to.eql('function');
    ctrl.dispose();
  });

  it('tree.set + path.request resolves selected ref', () => {
    const ctrl = Controller.create();
    const tree = sampleTree();
    ctrl.input({ type: 'tree.set', tree });
    ctrl.input({ type: 'path.request', path: ['a', 'b'] });

    const state = ctrl.current();
    expect(state.selectedPath).to.eql(['a', 'b']);
    expect(state.selectedRef).to.eql('ref-b');
    expect(ctrl.view().selection.ref).to.eql('ref-b');
    ctrl.dispose();
  });

  it('ref.request resolves selected path', () => {
    const ctrl = Controller.create();
    const tree = sampleTree();
    ctrl.input({ type: 'tree.set', tree });
    ctrl.input({ type: 'ref.request', ref: 'ref-a' });

    const state = ctrl.current();
    expect(state.selectedPath).to.eql(['a']);
    expect(state.selectedRef).to.eql('ref-a');
    expect(ctrl.view().treeHost.selectedPath).to.eql(['a']);
    ctrl.dispose();
  });

  it('tree.clear and reset enforce empty invariant', () => {
    const ctrl = Controller.create();
    ctrl.input({ type: 'tree.set', tree: sampleTree() });
    ctrl.input({ type: 'ref.request', ref: 'ref-a' });
    ctrl.input({ type: 'content.set', data: { foo: 1 } });

    ctrl.input({ type: 'tree.clear' });
    let state = ctrl.current();
    expect(state.tree).to.eql(undefined);
    expect(state.selectedPath).to.eql(undefined);
    expect(state.selectedRef).to.eql(undefined);
    expect(state.content).to.eql(undefined);

    ctrl.input({ type: 'tree.set', tree: sampleTree() });
    ctrl.input({ type: 'reset' });
    state = ctrl.current();
    expect(state.tree).to.eql(undefined);
    expect(state.selectedPath).to.eql(undefined);
    expect(state.selectedRef).to.eql(undefined);
    expect(state.content).to.eql(undefined);
    ctrl.dispose();
  });
});

function sampleTree(): t.TreeHostViewNodeList {
  const b: t.TreeHostViewNode = {
    path: ['a', 'b'],
    key: 'a/b',
    label: 'b',
    value: { slug: 'b', ref: 'ref-b' },
  };
  const a: t.TreeHostViewNode = {
    path: ['a'],
    key: 'a',
    label: 'a',
    value: { slug: 'a', ref: 'ref-a' },
    children: [b],
  };
  return [a];
}
