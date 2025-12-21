import { type t, describe, expect, it } from '../../-test.ts';
import { Error } from '../m.Error.ts';

describe('Yaml.Error', () => {
  describe('synthetic()', () => {
    it('constructs a minimal YAML error with a message', () => {
      const err = Error.synthetic({ message: 'boom' });

      expect(err.message).to.eql('boom');
      expect(err.code).to.be.a('string');
      expect(err.name).to.be.a('string');

      // Optional fields should be absent
      expect('pos' in err).to.eql(false);
    });

    it('includes pos when provided', () => {
      const pos: readonly [number, number] = [3, 7];
      const err = Error.synthetic({ message: 'bad', pos });

      expect(err.pos).to.eql([3, 7]);
    });

    it('allows explicit name and code overrides', () => {
      const err = Error.synthetic({
        message: 'alias error',
        name: 'YAMLParseError',
        code: 'BAD_ALIAS',
      });

      expect(err.name).to.eql('YAMLParseError');
      expect(err.code).to.eql('BAD_ALIAS');
    });

    it('never produces undefined code or name', () => {
      const err = Error.synthetic({ message: 'x' });

      expect(err.code).to.not.eql(undefined);
      expect(err.name).to.not.eql(undefined);
    });
  });
});
