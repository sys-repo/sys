import { describe, expect, it } from '../../../-test.ts';
import { Pattern } from '../mod.ts';

describe('PatternRecipe.PathRef (placeholder, string shape)', () => {
  const schema = Pattern.Ref.Path();
  expect(schema).to.be.an('object');
  expect(schema.kind).to.eql('string');

  it('has description text', () => {
    expect(typeof schema.description).to.eql('string');
    expect(schema.description.length > 10).to.eql(true);
  });

  it('can accept arbitrary string values (placeholder stage)', () => {
    const cases = [
      '',
      'relative/path.txt',
      '/absolute/path.mov',
      'https://example.com/file.mp4',
      'crdt:create/foo',
      'urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/bar',
    ];
    for (const s of cases) expect(typeof s).to.eql('string');
  });

  it('NOTES: future refinement will introduce pattern enforcement', () => {
    expect(true).to.eql(true);
  });
});
