import { type t, describe, expect, it } from '../../../-test.ts';
import { TraitsSchema } from '../mod.ts';

describe('TraitsSchema', () => {
  describe('TraitsSchema.gateAs', () => {
    it('returns disabled when opt is null (explicit opt-out)', () => {
      const result = TraitsSchema.gateAs({ traits: [], opt: null });
      expect(result.ok).to.eql(true);
      if (!result.ok) throw result.error;

      expect(result.enabled).to.eql(false);
    });

    it('returns not-requested when opt is undefined', () => {
      const result = TraitsSchema.gateAs({
        traits: [],
        opt: undefined,
      });

      expect(result.ok).to.eql(true);
      if (!result.ok) throw result.error;

      expect(result.enabled).to.eql(false);
      expect('requested' in result).to.eql(true);

      if (!('requested' in result)) throw new Error('expected requested flag');
      expect(result.requested).to.eql(false);
    });

    it('fails when gating is requested but trait is missing', () => {
      const result = TraitsSchema.gateAs({
        traits: [],
        opt: { of: 'media-composition' },
      });

      expect(result.ok).to.eql(false);
      if (!result.ok) {
        expect(result.error).to.be.instanceOf(Error);
        expect(result.error.message).to.include('media-composition');
      }
    });

    it('fails when trait exists but has no valid `as`', () => {
      const traits: readonly t.SlugTrait[] = [{ of: 'media-composition' }];
      const result = TraitsSchema.gateAs({
        traits,
        opt: { of: 'media-composition' },
      });

      expect(result.ok).to.eql(false);
      if (!result.ok) {
        expect(result.error.message).to.include('media-composition');
      }
    });

    it('resolves `as` when matching trait with valid `as` exists', () => {
      const traits: readonly t.SlugTrait[] = [{ of: 'media-composition', as: 'sequence' }];
      const result = TraitsSchema.gateAs({
        traits,
        opt: { of: 'media-composition' },
      });

      expect(result.ok).to.eql(true);
      if (result.ok && result.enabled) {
        expect(result.as).to.eql('sequence');
      } else {
        throw new Error('expected enabled gate');
      }
    });

    it('uses forcedAs when mode is force and trait.as is missing', () => {
      const traits: readonly t.SlugTrait[] = [{ of: 'media-composition' }];
      const result = TraitsSchema.gateAs({
        traits,
        opt: { of: 'media-composition', mode: 'force', forcedAs: 'sequence' },
      });

      expect(result.ok).to.eql(true);
      if (result.ok && result.enabled) {
        expect(result.as).to.eql('sequence');
      } else {
        throw new Error('expected enabled forced gate');
      }
    });

    it('fails when mode is force but forcedAs is not provided', () => {
      const traits: readonly t.SlugTrait[] = [{ of: 'media-composition' }];
      const result = TraitsSchema.gateAs({
        traits,
        opt: { of: 'media-composition', mode: 'force' },
      });

      expect(result.ok).to.eql(false);
      if (!result.ok) expect(result.error.message).to.include('media-composition');
    });
  });
});
