import { type t, describe, it, expect, expectTypeOf, Is, Obj, Str } from '../../../-test.ts';
import { createTestController, makeTestPlaybackBundle } from './u.fixture.ts';
import { attachPlaybackDriverEffect } from '../u.attachPlaybackDriverEffect.ts';

describe('controller: attachPlaybackDriverEffect', () => {
  it('attaches without throwing', () => {
    const ctrl = createTestController();
    expect(() => attachPlaybackDriverEffect(ctrl)).to.not.throw();
    ctrl.dispose();
  });
});
