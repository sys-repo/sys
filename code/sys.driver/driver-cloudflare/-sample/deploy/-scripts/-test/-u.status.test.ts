import { buildStatus } from '../u.status.ts';
import { DIST_LIMITS, selectionFiles } from '../../src/m.app/u.selection.ts';
import {
  c,
  describe,
  expect,
  expectError,
  Fmt,
  Fs,
  HashFmt,
  it,
  Pkg,
  stripAnsi,
  Text,
} from './common.ts';

describe('R2 deployment sample: startup build detail', () => {
  it('selected local Dist → canonical digest, not the manifest checksum', async () => {
    await using f = await fixture();
    expect(f.digest).not.to.eql(f.pin['dist.json']);
    const { detail } = await buildStatus(f.pin, f.dir.absolute);
    expect(detail).to.eql({
      label: 'build',
      value: `dist/ ${stripAnsi(HashFmt.digest(f.digest, { arrow: true }))}`,
    });
    expect(detail.value).to.eql(stripAnsi(detail.value));
  });

  it('filename projection → sorted assets plus manifest, without changing hash parts', async () => {
    await using f = await fixture();
    const local = await Pkg.Dist.Local.verify({ dir: f.dir.join('dist'), limits: DIST_LIMITS });
    if (local.kind !== 'verified') throw new Error(`Fixture Dist refused: ${local.kind}.`);
    const dist = local.evidence.dist;
    const before = { ...dist.hash.parts };
    const files = selectionFiles(dist);
    expect(files).to.eql(['dist.json', 'index.html']);
    expect(Object.isFrozen(files)).to.eql(true);
    expect(dist.hash.parts).to.eql(before);
    expect(dist.hash.parts).not.to.have.property('dist.json');
  });

  it('later pin mutation → status retains the checksum supplied at invocation', async () => {
    await using f = await fixture();
    const pin = { ...f.pin };
    const running = buildStatus(pin, f.dir.absolute);
    pin['dist.json'] = `sha256-${'0'.repeat(64)}`;
    const before = await running;
    const after = await buildStatus(f.pin, f.dir.absolute);
    expect(after.detail).to.eql(before.detail);
    const beforeText = before.formatDetail?.({ detail: before.detail });
    const afterText = after.formatDetail?.({ detail: after.detail });
    expect(afterText).to.eql(beforeText);
  });

  it('non-TTY presentation → full links without changing the plain status fact', async () => {
    await using f = await fixture();
    const { detail, formatDetail } = await buildStatus(f.pin, f.dir.absolute);
    const fact = { ...detail };
    const manifestUrl = Fs.Path.toFileUrl(f.dir.join('dist/dist.json'));
    const directoryUrl = new URL('./', manifestUrl);
    const path = Fmt.hyperlink(c.gray('dist/'), directoryUrl, { underline: true });
    const digest = HashFmt.digest(f.digest, { arrow: true, url: manifestUrl });
    const full = formatDetail?.({ detail: { ...detail } });
    expect(full).to.eql(`${path} ${digest}`);
    expect(stripAnsi(full ?? '')).to.eql(detail.value);
    for (const maxWidth of [0, 1, 2, 3, 4, 5, 6, 7, 8, 13, 14, 20, 21, 27, 28, 80]) {
      const value = formatDetail?.({ detail, maxWidth }) ?? '';
      expect(Text.Width.measure(value), `maxWidth: ${maxWidth}`).to.be.at.most(maxWidth);
    }
    expect(detail).to.eql(fact);
    expect(formatDetail?.({ detail })).to.eql(full);
  });

  it('same label with a different plain fact → no substituted build presentation', async () => {
    await using f = await fixture();
    const { detail, formatDetail } = await buildStatus(f.pin, f.dir.absolute);
    const different = { ...detail, value: 'a different build fact' };
    expect(formatDetail?.({ detail: different })).to.eql(undefined);
  });

  it('terminal presentation → distinct directory and manifest links with standard styling', async () => {
    await using f = await fixture();
    const { detail, formatDetail } = await buildStatus(f.pin, f.dir.absolute);
    const manifestUrl = Fs.Path.toFileUrl(f.dir.join('dist/dist.json'));
    const directoryUrl = new URL('./', manifestUrl);
    const directoryLink = Fmt.hyperlink(c.gray('dist/'), directoryUrl, { underline: true });
    for (const maxWidth of [80, 21, 14]) {
      const value = formatDetail?.({ detail, maxWidth }) ?? '';
      expect(value).to.contain(directoryLink);
      const digest = HashFmt.digest(f.digest, {
        arrow: true,
        url: manifestUrl,
        maxWidth: maxWidth - 6,
      });
      expect(value).to.contain(digest);
      expect(value).to.contain(c.green('←'));
      expect(Text.Width.measure(value)).to.be.at.most(maxWidth);
    }
    for (const maxWidth of [10, 3]) {
      const value = formatDetail?.({ detail, maxWidth }) ?? '';
      expect(value).to.contain(`\x1b]8;;${directoryUrl.href}\x1b\\`);
      expect(value).not.to.contain(manifestUrl.href);
      expect(Text.Width.measure(value)).to.be.at.most(maxWidth);
    }
    expect(formatDetail?.({ detail, maxWidth: 0 })).to.eql('');
    expect(formatDetail?.({ detail: { label: 'other', value: 'plain' } })).to.eql(undefined);
  });

  it('missing local output → unavailable detail without a serving prerequisite', async () => {
    await using f = await fixture();
    await Fs.remove(f.dir.join('dist'));
    expect(await buildStatus(f.pin, f.dir.absolute)).to.eql({
      detail: { label: 'build', value: 'dist/ (unavailable: missing)' },
    });
  });

  it('invalid pin → refusal even when local output is missing', async () => {
    await using f = await fixture();
    await Fs.remove(f.dir.join('dist'));
    await expectError(
      () => buildStatus({ ...f.pin, 'dist.json': 'invalid' }, f.dir.absolute),
      'Invalid sample Dist pin.',
    );
  });

  it('different pin → no misleading build digest', async () => {
    await using f = await fixture();
    const otherPin = { 'dist.json': `sha256-${'0'.repeat(64)}` };
    const status = await buildStatus(otherPin, f.dir.absolute);
    expect(status).to.eql({
      detail: { label: 'build', value: 'dist/ (unavailable: integrity-mismatch)' },
    });
  });

  it('changed local bytes → no misleading build digest', async () => {
    await using f = await fixture();
    await Fs.write(f.dir.join('dist/index.html'), 'changed', { throw: true });
    expect(await buildStatus(f.pin, f.dir.absolute)).to.eql({
      detail: { label: 'build', value: 'dist/ (unavailable: content-mismatch)' },
    });
  });
});

/** One fixture-owned local Dist; status receives its pin, not a metadata-loading callback. */
async function fixture() {
  const temp = await Fs.makeTempDir({ prefix: 'sample-r2-status-' });
  try {
    const dir = Fs.toDir(await Fs.realPath(temp.absolute));
    await Fs.write(dir.join('dist/index.html'), 'fixture', { throw: true });
    await Pkg.Dist.compute({
      dir: dir.join('dist'),
      pkg: { name: '@test/r2', version: '0.0.0' },
      save: true,
    });
    const verified = await Pkg.Dist.Local.verify({ dir: dir.join('dist'), limits: DIST_LIMITS });
    if (verified.kind !== 'verified') throw new Error(`Fixture Dist refused: ${verified.kind}.`);
    return {
      dir,
      pin: { 'dist.json': verified.evidence.integrity },
      digest: verified.evidence.dist.hash.digest,
      async [Symbol.asyncDispose]() {
        await Fs.remove(dir.absolute);
      },
    };
  } catch (error) {
    await Fs.remove(temp.absolute);
    throw error;
  }
}
