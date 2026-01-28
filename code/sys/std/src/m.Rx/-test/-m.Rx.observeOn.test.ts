import { describe, expect, it, Time } from '../../-test.ts';
import { Rx } from '../mod.ts';

describe('Rx.observeOn(Rx.animationFrameScheduler)', () => {
  it('is polyfilled on server', async () => {
    let count = 0;
    const $ = Rx.subject();
    $.pipe(Rx.observeOn(Rx.animationFrameScheduler)).subscribe(() => count++);
    $.next(); // NB: if the "requestAnimationFrame" was not polyfilled this would blow up here.
    await Time.wait(0);
    expect(count).to.eql(1);
  });
});
