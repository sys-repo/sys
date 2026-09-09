import { describe, expect, it } from '../../../-test.ts';
import { Pattern } from '../mod.ts';

describe('PatternRecipe.Id', () => {
  const pattern = Pattern.Id().pattern;
  const regex = new RegExp(pattern);
  expect(pattern, 'Id pattern must be defined').to.be.a('string');

  it('accepts stable ids', () => {
    const ok = ['video', 'video-player', 'video.player-01', 'v', 'v1', 'a-.-.-b', '0lead'];
    for (const s of ok) expect(regex.test(s)).to.eql(true);
  });

  it('rejects invalid ids', () => {
    const bad = [
      '', // empty
      '-leading',
      '.leading',
      '_underscore',
      'UPPER',
      'miXed',
      'has space',
      'slash/in',
    ];
    for (const s of bad) expect(regex.test(s)).to.eql(false);
  });
});
