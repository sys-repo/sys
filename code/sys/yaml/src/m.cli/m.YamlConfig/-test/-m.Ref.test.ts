import { describe, expect, expectError, it } from '../../../-test.ts';
import { Ref } from '../m/m.Ref.ts';

const dir = './-config/@sys.example/static' as const;

describe('YamlConfig.Ref', () => {
  it('maps a bare config name into the configured directory', () => {
    expect(Ref.resolve({ value: 'view', dir })).to.eql({
      kind: 'name',
      input: 'view',
      path: './-config/@sys.example/static/view.yaml',
      name: 'view',
    });
  });

  it('treats path-like values as explicit paths and derives the name from the file stem', () => {
    expect(Ref.resolve({ value: './-config/@sys.example/static/docs.yaml', dir })).to.eql({
      kind: 'path',
      input: './-config/@sys.example/static/docs.yaml',
      path: './-config/@sys.example/static/docs.yaml',
      name: 'docs',
    });
    expect(Ref.resolve({ value: 'static.view.yaml', dir })).to.eql({
      kind: 'path',
      input: 'static.view.yaml',
      path: 'static.view.yaml',
      name: 'static.view',
    });
    expect(Ref.resolve({ value: 'nested/view.yml', dir })).to.eql({
      kind: 'path',
      input: 'nested/view.yml',
      path: 'nested/view.yml',
      name: 'view',
    });
  });

  it('supports custom extensions for bare names', () => {
    expect(Ref.resolve({ value: 'canon', dir: './profiles' as const, ext: 'yml' })).to.eql({
      kind: 'name',
      input: 'canon',
      path: './profiles/canon.yml',
      name: 'canon',
    });
  });

  it('rejects missing refs and directory-like refs', async () => {
    await expectError(
      () => Ref.resolve({ value: '', dir, label: '--profile' }),
      'YamlConfig.Ref: missing required --profile.',
    );
    await expectError(
      () => Ref.resolve({ value: './-config/@sys.example/static/', dir, label: '--config' }),
      'YamlConfig.Ref: --config must reference a YAML file or bare config name.',
    );
  });
});
