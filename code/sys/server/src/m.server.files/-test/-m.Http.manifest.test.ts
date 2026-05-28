import { Files } from '@sys/model/files';
import { FilesMemory } from '@sys/model/files/memory';
import { describe, expect, it, type t } from '../../-test.ts';
import { FilesServer } from '../mod.ts';
import { Fixture } from './u.fixture.ts';

describe('FilesServer.Http.manifest', () => {
  it('projects the Files manifest command as GET JSON using the default path', async () => {
    const backing = backingOf();
    const projection = FilesServer.Http.manifest({ files: backing });
    if (!projection) throw new Error('Expected manifest projection.');

    expect(projection.path).to.eql('/files/manifest');
    expect(projection.label).to.eql('files:manifest');

    const request = new Request('http://localhost/files/manifest');
    expect(projection.matches(request)).to.eql(true);

    const res = await projection.response(request);
    expect(res.status).to.eql(200);
    expect(res.headers.get('content-type')).to.contain('application/json');
    expect(await res.json()).to.eql(await Fixture.direct(backing, Files.Cmd.Name.manifest, {}));
  });

  it('derives the manifest route from a custom base path', () => {
    const backing = backingOf();
    const projection = FilesServer.Http.manifest({ files: backing, path: '/draft/files' });
    if (!projection) throw new Error('Expected manifest projection.');

    expect(projection.path).to.eql('/draft/files/manifest');
    expect(projection.matches(new Request('http://localhost/draft/files/manifest'))).to.eql(true);
    expect(projection.matches(new Request('http://localhost/files/manifest'))).to.eql(false);
  });

  it('returns method and route failures without invoking the command transport', async () => {
    const backing = backingOf();
    const projection = FilesServer.Http.manifest({ files: backing, path: '/files' });
    if (!projection) throw new Error('Expected manifest projection.');

    const wrongMethod = await projection.response(
      new Request('http://localhost/files/manifest', { method: 'POST' }),
    );
    expect(wrongMethod.status).to.eql(405);
    expect(wrongMethod.headers.get('allow')).to.eql('GET');

    const wrongPath = await projection.response(new Request('http://localhost/wrong'));
    expect(wrongPath.status).to.eql(404);
  });

  it('does not create a projection when manifest is unsupported', () => {
    const backing = backingOf();
    const unsupported: t.FilesServer.Backing = {
      ...backing,
      capabilities: { ...backing.capabilities, manifest: false },
    };
    expect(FilesServer.Http.manifest({ files: unsupported })).to.eql(undefined);
  });
});

/**
 * Helpers:
 */
function backingOf(): t.FilesServer.Backing {
  return FilesMemory.Readonly.create({
    policy: Files.Policy.readonly('**'),
    files: {
      'hello.txt': 'hello manifest\n',
      'docs/readme.md': '# Readme\n',
    },
  });
}
