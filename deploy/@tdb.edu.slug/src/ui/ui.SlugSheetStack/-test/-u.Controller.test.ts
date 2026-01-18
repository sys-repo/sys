import { SAMPLES, describe, expect, it } from '../../../-test.ts';
import { SlugSheet } from '../../ui.SlugSheet/mod.ts';
import { TreeHost } from '../../ui.TreeHost/-spec/mod.ts';
import { SlugSheetStack } from '../mod.ts';

describe('SlugSheetStack.Controller', () => {
  it('push/pop lifecycle maintains stack and disposes children', () => {
    const sheet = SlugSheet.Controller.create({});
    const controller = SlugSheetStack.Controller.create({ id: 'root', sheet });
    expect(controller.stack.value.length).to.eql(1);

    const overlay1 = SlugSheet.Controller.create({});
    controller.push({ id: 'overlay', sheet: overlay1 });
    expect(controller.stack.value.length).to.eql(2);

    controller.pop();
    expect(controller.stack.value.length).to.eql(1);

    const overlay2 = SlugSheet.Controller.create({});
    const overlay3 = SlugSheet.Controller.create({});
    controller.push({ id: 'overlay-2', sheet: overlay2 });
    controller.push({ id: 'overlay-3', sheet: overlay3 });
    expect(controller.stack.value.length).to.eql(3);

    controller.pop(2);
    expect(controller.stack.value.length).to.eql(1);

    controller.pop();
    expect(controller.stack.value.length).to.eql(1);

    controller.dispose();
    expect(controller.stack.value.length).to.eql(0);
  });
});
