import { describe, expect, it } from '../../../-test.ts';
import { Icon } from './mod.ts';

describe('Icon', () => {
  it('initializes independently of the aggregate UI common barrel', () => {
    expect(Icon.renderer).to.be.a('function');
  });
});
