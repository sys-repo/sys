import { describe, expect, it } from '../../../-test.ts';
import { SlugSheet } from '../mod.ts';

describe('SlugSheet.Controller', () => {
  it('exposes stable props', () => {
    const controller = SlugSheet.Controller.create({});

    const a = controller.props();
    const b = controller.props();

    expect(a).to.not.equal(b);
    expect(a).to.eql({});
    expect(b).to.eql({});

    controller.dispose();
  });

  it('reflects provided slots', () => {
    let slots = { main: 'a' };
    const controller = SlugSheet.Controller.create({ props: () => ({ slots }) });
    expect(controller.props().slots).to.eql({ main: 'a' });

    slots = { main: 'b' };
    expect(controller.props().slots).to.eql({ main: 'b' });

    controller.dispose();
  });
});
