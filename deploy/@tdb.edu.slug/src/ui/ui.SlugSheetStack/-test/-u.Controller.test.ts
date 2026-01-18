import { describe, expect, it } from '../../../-test.ts';
import { SlugSheet } from '../../ui.SlugSheet/mod.ts';
import { SlugSheetStack } from '../mod.ts';
import { Signal } from '../common.ts';

describe('SlugSheetStack.Controller', () => {
  it('push/pop lifecycle maintains stack and disposes children', () => {
    const sheet = SlugSheet.Controller.create({});
    const controller = SlugSheetStack.Controller.create({ id: 'root', sheet });
    expect(controller.length).to.eql(1);

    const overlay1 = SlugSheet.Controller.create({});
    controller.push({ id: 'overlay-1', sheet: overlay1 });
    expect(controller.length).to.eql(2);

    controller.pop();
    expect(controller.length).to.eql(1);

    const overlay2 = SlugSheet.Controller.create({});
    const overlay3 = SlugSheet.Controller.create({});
    controller.push({ id: 'overlay-2', sheet: overlay2 });
    controller.push({ id: 'overlay-3', sheet: overlay3 });
    expect(controller.length).to.eql(3);

    controller.pop(2);
    expect(controller.length).to.eql(1);

    controller.pop();
    expect(controller.length).to.eql(1);

    controller.dispose();
    expect(controller.length).to.eql(0);
  });

  it('listen to signal changes', () => {
    const controller = SlugSheetStack.Controller.create();

    let changes = 0;
    const dispose = Signal.effect(() => {
      controller.stack.value;
      changes++;
    });
    expect(changes).to.eql(1);

    controller.push({ id: 'test-sheet', sheet: SlugSheet.Controller.create({}) });
    expect(changes).to.eql(2);

    controller.pop();
    expect(changes).to.eql(4);

    dispose();
  });
});
