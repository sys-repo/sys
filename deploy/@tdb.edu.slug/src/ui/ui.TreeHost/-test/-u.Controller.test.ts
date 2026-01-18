import { describe, expect, it } from '../../../-test.ts';
import { TreeHost } from '../mod.ts';

describe('TreeHost.Controller', () => {
  it('exposes stable props', () => {
    const controller = TreeHost.Controller.create({});

    const a = controller.props();
    const b = controller.props();

    expect(a).to.not.equal(b);
    expect(a).to.eql({});
    expect(b).to.eql({});

    controller.dispose();
  });

  it('reflects provided slots', () => {
    let slots = { main: 'a' };
    const controller = TreeHost.Controller.create({ props: () => ({ slots }) });
    expect(controller.props().slots).to.eql({ main: 'a' });

    slots = { main: 'b' };
    expect(controller.props().slots).to.eql({ main: 'b' });

    controller.dispose();
  });

  it('handles full TreeHost slot surface (tree, aux, main)', () => {
    const slots = {
      tree: 'tree-content',
      aux: 'aux-content',
      main: 'main-content',
    };
    const controller = TreeHost.Controller.create({ props: () => ({ slots }) });

    expect(controller.props().slots).to.eql(slots);

    controller.dispose();
  });

  it('handles empty slot callback function', () => {
    const emptyFn = (slot: string) => `empty-${slot}`;
    const slots = { empty: emptyFn };
    const controller = TreeHost.Controller.create({ props: () => ({ slots }) });

    const props = controller.props();
    expect(props.slots?.empty).to.equal(emptyFn);
    expect(props.slots?.empty?.('tree')).to.equal('empty-tree');
    expect(props.slots?.empty?.('aux')).to.equal('empty-aux');
    expect(props.slots?.empty?.('main')).to.equal('empty-main');

    controller.dispose();
  });

  it('handles partial slot combinations', () => {
    const controller = TreeHost.Controller.create({ props: () => ({ slots: { tree: 'nav' } }) });
    expect(controller.props().slots).to.eql({ tree: 'nav' });

    // Update to include aux
    const controller2 = TreeHost.Controller.create({
      props: () => ({ slots: { tree: 'nav', aux: 'sidebar' } }),
    });
    expect(controller2.props().slots).to.eql({ tree: 'nav', aux: 'sidebar' });

    // Update to include main
    const controller3 = TreeHost.Controller.create({
      props: () => ({ slots: { main: 'content' } }),
    });
    expect(controller3.props().slots).to.eql({ main: 'content' });

    controller.dispose();
    controller2.dispose();
    controller3.dispose();
  });

  it('handles independent slot updates', () => {
    let slots = { tree: 'initial-tree', aux: 'initial-aux', main: 'initial-main' };
    const controller = TreeHost.Controller.create({ props: () => ({ slots }) });

    expect(controller.props().slots).to.eql(slots);

    // Update tree only
    slots = { ...slots, tree: 'updated-tree' };
    expect(controller.props().slots).to.eql({
      tree: 'updated-tree',
      aux: 'initial-aux',
      main: 'initial-main',
    });

    // Update aux only
    slots = { ...slots, aux: 'updated-aux' };
    expect(controller.props().slots).to.eql({
      tree: 'updated-tree',
      aux: 'updated-aux',
      main: 'initial-main',
    });

    // Update main only
    slots = { ...slots, main: 'updated-main' };
    expect(controller.props().slots).to.eql({
      tree: 'updated-tree',
      aux: 'updated-aux',
      main: 'updated-main',
    });

    controller.dispose();
  });

  it('handles all slots with empty function', () => {
    const emptyFn = (slot: string) => `placeholder-${slot}`;
    const slots = {
      tree: 'actual-tree',
      aux: 'actual-aux',
      main: 'actual-main',
      empty: emptyFn,
    };
    const controller = TreeHost.Controller.create({ props: () => ({ slots }) });

    const props = controller.props();
    expect(props.slots).to.eql(slots);
    expect(props.slots?.tree).to.equal('actual-tree');
    expect(props.slots?.aux).to.equal('actual-aux');
    expect(props.slots?.main).to.equal('actual-main');
    expect(props.slots?.empty).to.equal(emptyFn);

    controller.dispose();
  });

  it('maintains clean boundary - only controller domain', () => {
    const controller = TreeHost.Controller.create({ props: () => ({ slots: { main: 'test' } }) });
    const props = controller.props();

    // Reset to only controller domain properties
    const expectedKeys = Object.keys({ slots: undefined });
    const actualKeys = Object.keys(props);

    expect(actualKeys).to.eql(expectedKeys);
    expect(props.slots).to.eql({ main: 'test' });

    controller.dispose();
  });

  it('handles undefined props function with defaults', () => {
    const controller = TreeHost.Controller.create({});
    const props = controller.props();

    expect(props).to.eql({}); // Should return empty object, not undefined
    expect('slots' in props).to.be.false; // Property should not exist

    controller.dispose();
  });

  it('handles props function that throws', () => {
    const controller = TreeHost.Controller.create({
      props: () => {
        throw new Error('Test error');
      },
    });

    expect(() => controller.props()).to.throw('Test error');

    controller.dispose();
  });

  it('handles multiple controllers independently', () => {
    const controller1 = TreeHost.Controller.create({
      props: () => ({ slots: { main: 'controller-1' } }),
    });
    const controller2 = TreeHost.Controller.create({
      props: () => ({ slots: { main: 'controller-2' } }),
    });

    expect(controller1.props()).to.not.equal(controller2.props());
    expect(controller1.props().slots?.main).to.equal('controller-1');
    expect(controller2.props().slots?.main).to.equal('controller-2');

    controller1.dispose();
    controller2.dispose();
  });

  it('maintains identity across dispose', () => {
    const controller = TreeHost.Controller.create({});
    const id = controller.id;

    controller.dispose();

    expect(controller.id).to.equal(id); // ID should remain stable
    expect(() => controller.props()).to.not.throw(); // Should not throw post-dispose
    expect(controller.props()).to.eql({}); // Should return empty object post-dispose
  });
});
