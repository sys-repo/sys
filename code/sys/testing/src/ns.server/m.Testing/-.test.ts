import { type t, describe, it, expect } from '../-test.ts';
import { Testing } from './mod.ts';

describe('Server ← test helpers', () => {
  describe('API', () => {
    it('base: std (includes HTTP)', async () => {
      const m = await import('@sys/std/testing/server');
      const props = Object.keys(m.Testing) as (keyof typeof m.Testing)[];
      props.forEach((key) => expect(Testing[key]).to.equal(m.Testing[key]));
    });
  });

  describe('files-system: dir', () => {});
});
