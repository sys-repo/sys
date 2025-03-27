import { describe, expect, it } from '../../-test.ts';
import { createSignals } from './mod.ts';

describe('Signals', () => {
  it('create', () => {
    const signals = createSignals();
    expect(typeof signals.video.play === 'function').to.eql(true);

    expect(signals.stage.value === 'Entry').to.be.true;
    expect(signals.theme.value === 'Dark').to.be.true;
    expect(signals.dist.value).to.eql(undefined);

    console.info();
    console.info('SLC:Signals:\n', signals);
    console.info();
  });
});
