import { type t, describe, expect, it } from '../../-test.ts';
import { Rx } from '../mod.ts';

describe('Rx.subject (factory)', () => {
  it('void', () => {
    let fired = 0;
    const subject = Rx.subject();

    subject.subscribe(() => fired++);
    subject.next();
    expect(fired).to.eql(1);

    subject.complete();
    subject.next();
    expect(fired).to.eql(1);
  });

  it('<T>', () => {
    type T = { type: string };
    const subject = Rx.subject<T>();
    const fired: T[] = [];
    subject.subscribe((e) => fired.push(e));
    subject.next({ type: 'foo' });
    expect(fired[0]).to.eql({ type: 'foo' });
  });
});
