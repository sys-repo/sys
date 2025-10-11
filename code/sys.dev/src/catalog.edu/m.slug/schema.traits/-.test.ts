import { describe, expect, it } from '../../-test.ts';
import { Value } from './common.ts';
import { VideoPlayerPropsSchema, VideoRecorderPropsSchema } from './mod.ts';

describe('schema.traits', () => {
  const cases = [
    { name: 'VideoPlayerPropsSchema', schema: VideoPlayerPropsSchema },
    { name: 'VideoRecorderPropsSchema', schema: VideoRecorderPropsSchema },
  ];

  for (const { name, schema } of cases) {
    describe(name, () => {
      it('validates minimal correct object', () => {
        const value = { name: 'foo' };
        const result = Value.Check(schema, value);
        expect(result).to.eql(true);
      });

      it('fails when name is empty', () => {
        const value = { name: '' };
        const result = Value.Check(schema, value);
        expect(result).to.eql(false);
      });

      it('has id and title metadata', () => {
        expect(typeof schema.$id).to.eql('string');
        expect(typeof schema.title).to.eql('string');
      });
    });
  }
});
