import { describe, expect, it } from '../../-test.ts';
import { AppSignals } from './common.ts';
import { App } from './mod.ts';

describe('App', () => {
  it('API', () => {
    expect(App.Signals).to.equal(AppSignals);
  });
});
