import { describe, expect, expectError, it } from '../../../-test.ts';
import { resolveConfigRef } from '../u.config.add.ts';

describe('HttpStatic config refs', () => {
  it('maps a bare config name into the static owner config directory', () => {
    expect(resolveConfigRef('view')).to.eql({
      kind: 'name',
      input: 'view',
      path: '-config/@sys.http/static/view.yaml',
      name: 'view',
    });
  });

  it('treats path-like values as explicit paths and derives the name from the file stem', () => {
    expect(resolveConfigRef('./-config/@sys.http/static/docs.yaml')).to.eql({
      kind: 'path',
      input: './-config/@sys.http/static/docs.yaml',
      path: './-config/@sys.http/static/docs.yaml',
      name: 'docs',
    });
    expect(resolveConfigRef('static.view.yaml')).to.eql({
      kind: 'path',
      input: 'static.view.yaml',
      path: 'static.view.yaml',
      name: 'static.view',
    });
    expect(resolveConfigRef('nested/view.yml')).to.eql({
      kind: 'path',
      input: 'nested/view.yml',
      path: 'nested/view.yml',
      name: 'view',
    });
  });

  it('rejects missing refs and directory-like refs', async () => {
    await expectError(
      () => resolveConfigRef(''),
      'HttpStatic config add: missing required --config.',
    );
    await expectError(
      () => resolveConfigRef('./-config/@sys.http/static/'),
      'HttpStatic config add: --config must reference a YAML file or bare config name.',
    );
  });
});
