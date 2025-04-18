import { describe, expect, it } from '../../-test.ts';
import { AppSignals, Layout } from './common.ts';
import { App } from './mod.ts';

describe('App', () => {
  it('API', () => {
    expect(App.Signals).to.equal(AppSignals);
    expect(App.signals).to.equal(AppSignals.create);
    expect(App.Layout).to.equal(Layout);
  });
});
