import { describe, expect, it } from '../-test.ts';

import { Rx, Err } from '../mod.ts';
import { Is } from './mod.ts';

describe('Is (common flags)', () => {
  it('rx: observable | subject', () => {
    // NB: tested in the corresponding module file.
    expect(Is.observable).to.equal(Rx.Is.observable);
    expect(Is.subject).to.equal(Rx.Is.subject);
  });

  it('Is.errorLike', () => {
    expect(Is.errorLike).to.equal(Err.isErrorLike);
  });

  it('Is.promise', () => {
    const test = (input: any, expected: boolean) => {
      expect(Is.promise(input)).to.eql(expected);
    };

    const myPromise = () => new Promise<void>((resolve) => resolve());
    const wait = async () => await myPromise();

    test(undefined, false);
    test(123, false);
    test('hello', false);
    test(['hello', 123], false);
    test(true, false);
    test(null, false);
    test({}, false);

    test({ then: () => null }, true);
    test(wait(), true);
    test(myPromise(), true);

    const p = myPromise as unknown;
    if (Is.promise<string>(p)) {
      p.then(); // Type inferred after boolean check.
    }
  });
});
