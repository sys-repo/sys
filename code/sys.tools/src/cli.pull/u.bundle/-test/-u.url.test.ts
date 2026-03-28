import { describe, expect, it } from '../../../-test.ts';
import { toDistUrl } from '../u.url.ts';

describe('cli.pull/u.bundle → toDistUrl', () => {
  it('accepts domain shorthand and defaults to https', () => {
    expect(toDistUrl('fs.db.team')?.href).to.eql('https://fs.db.team/dist.json');
    expect(toDistUrl('fs.db.team/foo')?.href).to.eql('https://fs.db.team/foo/dist.json');
  });

  it('preserves explicit remote https urls', () => {
    expect(toDistUrl('https://fs.db.team')?.href).to.eql('https://fs.db.team/dist.json');
    expect(toDistUrl('https://fs.db.team/dist.json')?.href).to.eql(
      'https://fs.db.team/dist.json',
    );
  });

  it('defaults localhost-style inputs to http', () => {
    expect(toDistUrl('localhost:4040')?.href).to.eql('http://localhost:4040/dist.json');
    expect(toDistUrl('127.0.0.1:4040')?.href).to.eql('http://127.0.0.1:4040/dist.json');
    expect(toDistUrl('http://localhost:4040/foo')?.href).to.eql(
      'http://localhost:4040/foo/dist.json',
    );
  });

  it('rejects invalid url input', () => {
    expect(toDistUrl('not a url')).to.eql(undefined);
    expect(toDistUrl('/absolute/path')).to.eql(undefined);
    expect(toDistUrl('')).to.eql(undefined);
  });
});
