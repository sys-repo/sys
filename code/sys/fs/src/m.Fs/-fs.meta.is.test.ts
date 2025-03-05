import { describe, expect, it } from '../-test.ts';
import { Path } from './common.ts';
import { Fs } from './mod.ts';

describe('Fs.Is (flags)', () => {
  const Is = Fs.Is;

  it('has mapped Path methods', () => {
    // NB: mapped helpers (convenience).
    expect(Is.absolute).to.equal(Fs.Path.Is.absolute);
    expect(Is.glob).to.equal(Fs.Path.Is.glob);
  });

  it('Is.dir', async () => {
    expect(await Is.dir('.')).to.eql(true);
    expect(await Is.dir(Path.resolve('.'))).to.eql(true);
    expect(await Is.dir('./deno.json')).to.eql(false);
    expect(await Is.dir('./404.json')).to.eql(false); // NB: target does not exist.
  });

  it('Is.file', async () => {
    expect(await Is.file('.')).to.eql(false);
    expect(await Is.file('./deno.json')).to.eql(true);
    expect(await Is.file(Path.resolve('./deno.json'))).to.eql(true);
    expect(await Is.file('./404.json')).to.eql(false); // NB: target does not exist.
  });

  it('Is.binary', async () => {
    expect(await Is.binary('.')).to.eql(false);
    expect(await Is.binary('./deno.json')).to.eql(false);
    expect(await Is.binary('./src/-test/-sample-files/volcano.jpg')).to.eql(true);
  });
});
