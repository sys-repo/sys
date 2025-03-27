import { type t, describe, it, expect, Testing } from '../../-test.ts';
import { createSignals } from './mod.ts';

describe('Signals', () => {
  it('create', () => {
    const signals = createSignals();
    expect(typeof signals.video.play === 'function').to.eql(true);
    expect(signals.stage.value === 'Entry').to.eql(true);
  });
});
