import { describe, expect, it } from '../../../-test.ts';
import { SlugSheet } from '../mod.ts';

describe('SlugSheet.Controller', () => {
  it('exposes stable props', () => {
    const controller = SlugSheet.Controller.create({});

    const props = controller.props();
    expect(props.debug).to.be.undefined;
    expect(props.theme).to.be.undefined;
    expect(props.slots).to.be.undefined;

    const next = controller.props();
    expect(next.debug).to.be.undefined;
    expect(next.theme).to.be.undefined;
    expect(next.slots).to.be.undefined;

    controller.dispose();
  });

  it('reflects provided slots', () => {
    const slots = { main: 'test' };
    const controller = SlugSheet.Controller.create({ slots });
    const props = controller.props();
    expect(props.slots).to.equal(slots);
    expect(props.slots).to.eql(slots);

    controller.dispose();
  });
});
