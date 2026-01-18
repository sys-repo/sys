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
