import { type t, describe, it, expect } from '../-test.ts';
import { Dev } from './mod.ts';
import { Theme } from '../u/mod.ts';

describe('Dev', () => {
  it('API', () => {
    expect(Dev.Theme).to.equal(Theme);
  });
});
