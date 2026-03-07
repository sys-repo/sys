import { describe, expect, it } from '../../-test.ts';
import { Rx } from '../mod.ts';

describe('Rx.behaviorSubject (factory)', () => {
  it('replay latest on connect - <T>', () => {
    const subject = Rx.behaviorSubject(0);

    const fired: number[] = [];
    subject.subscribe((e) => fired.push(e));
    subject.next(123);

    expect(fired.length).to.eql(2);
    expect(fired[0]).to.eql(0);
    expect(fired[1]).to.eql(123);
  });
});
