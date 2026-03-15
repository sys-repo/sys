import { describe, expect, Is, it } from '../../-test.ts';
import { DenoDeploy } from './mod.ts';

describe('DenoDeploy', () => {
  it('API', () => {
    expect(Is.func(DenoDeploy.stage)).to.eql(true);
    expect(Is.func(DenoDeploy.deploy)).to.eql(true);
  });
});
