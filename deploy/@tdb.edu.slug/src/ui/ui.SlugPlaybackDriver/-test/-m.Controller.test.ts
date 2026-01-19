import { describe, expect, it } from '../../../-test.ts';
import { type t, Is, Str } from '../common.ts';
import { SlugPlaybackDriver } from '../mod.ts';

describe('SlugPlaybackDriver.Controller', () => {
  it('creates controller with lifecycle', () => {
    const controller = SlugPlaybackDriver.Controller.create();

    expect(controller).to.not.eql(undefined);
    expect(Is.str(controller.id)).to.be.true;
    expect(controller.id).to.include('slugplayback-');
    expect(Is.func(controller.props)).to.be.true;
    expect(Is.func(controller.dispose)).to.be.true;

    const props = controller.props();
    expect(props).to.eql({});
    expect('slots' in props).to.be.false;

    controller.dispose();
  });

  it('controller has unique IDs', () => {
    const controller1 = SlugPlaybackDriver.Controller.create();
    const controller2 = SlugPlaybackDriver.Controller.create();

    expect(controller1.id).to.not.equal(controller2.id);
    expect(controller1.id).to.include('slugplayback-');
    expect(controller2.id).to.include('slugplayback-');

    controller1.dispose();
    controller2.dispose();
  });

  it('handles props function correctly', () => {
    const slots = { aux: 'test-component' };
    const mockProps = () => ({ slots });
    const controller = SlugPlaybackDriver.Controller.create({ props: mockProps });

    const props = controller.props();
    expect(props.slots).to.eql(slots);

    controller.dispose();
  });

  it('handles empty args gracefully', () => {
    const controller = SlugPlaybackDriver.Controller.create({});

    expect(controller).to.not.equal(undefined);
    expect(Is.str(controller.id)).to.be.true;
    expect(Is.func(controller.props)).to.be.true;

    const props = controller.props();
    expect(props).to.eql({});

    controller.dispose();
  });

  it('maintains identity across dispose', () => {
    const controller = SlugPlaybackDriver.Controller.create({});
    const id = controller.id;

    controller.dispose();

    expect(controller.id).to.equal(id);
    expect(() => controller.props()).to.not.throw();
    expect(controller.props()).to.eql({});
  });
});
