import { buildStatus } from '../u.status.ts';
import { selectionFiles } from '../u.selection.ts';
import { DIST_LIMITS } from '../../src/m.app/u.selection.ts';
import {
  c,
  describe,
  expect,
  expectError,
  Fmt,
  Fs,
  HashFmt,
  it,
  Obj,
  Pkg,
  stripAnsi,
  Text,
} from './common.ts';

describe('R2 deployment sample: startup build detail', () => {
  it('selected local Dist → canonical digest, not the manifest checksum', async () => {
    await using f = await fixture();
    expect(f.digest).not.to.eql(f.artifact.integrity);
    const { detail } = await buildStatus(f.dir.absolute);
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

    expect(selectionFiles(dist)).to.eql(['dist.json', 'index.html']);
    expect(dist.hash.parts).to.eql(before);
    expect(dist.hash.parts).not.to.have.property('dist.json');
  });

  it('reordered artifact filenames → the same selected local build', async () => {
    await using f = await fixture();
    const before = await buildStatus(f.dir.absolute);
    await Fs.writeJson(f.dir.join('artifact.json'), {
      ...f.artifact,
      files: [...f.artifact.files].reverse(),
    }, { throw: true });
    const after = await buildStatus(f.dir.absolute);
    expect(after.detail).to.eql(before.detail);
    expect(after.formatDetail?.({ detail: after.detail })).to.eql(
      before.formatDetail?.({ detail: before.detail }),
    );
  });

  it('non-TTY presentation → full links without changing the plain status fact', async () => {
    await using f = await fixture();
    const { detail, formatDetail } = await buildStatus(f.dir.absolute);
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
    const { detail, formatDetail } = await buildStatus(f.dir.absolute);
    const other = { ...detail, value: 'a different build fact' };
    expect(formatDetail?.({ detail: other })).to.eql(undefined);
  });

  it('terminal presentation → distinct directory and manifest links with standard styling', async () => {
    await using f = await fixture();
    const { detail, formatDetail } = await buildStatus(f.dir.absolute);
    const manifestUrl = Fs.Path.toFileUrl(f.dir.join('dist/dist.json'));
    const directoryUrl = new URL('./', manifestUrl);
    const directoryLink = Fmt.hyperlink(c.gray('dist/'), directoryUrl, { underline: true });

    for (const maxWidth of [80, 21, 14]) {
      const value = formatDetail?.({ detail, maxWidth }) ?? '';
      expect(value).to.contain(directoryLink);
      expect(value).to.contain(HashFmt.digest(f.digest, {
        arrow: true,
        url: manifestUrl,
        maxWidth: maxWidth - 6,
      }));
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

  it('missing local output → unavailable detail without links or a serving prerequisite', async () => {
    await using f = await fixture();
    await Fs.remove(f.dir.join('dist'));
    expect(await buildStatus(f.dir.absolute)).to.eql({
      detail: { label: 'build', value: 'dist/ (unavailable: missing)' },
    });
  });

  it('invalid selection metadata → refusal even when local output is missing', async () => {
    await using f = await fixture();
    await Fs.remove(f.dir.join('dist'));
    await Fs.writeJson(f.dir.join('artifact.json'), {
      ...f.artifact,
      files: ['dist.json'],
    }, { throw: true });
    await expectError(() => buildStatus(f.dir.absolute), 'Invalid sample artifact.');
  });

  it('different artifact pin → no misleading build digest', async () => {
    await using f = await fixture();
    await Fs.writeJson(f.dir.join('artifact.json'), {
      ...f.artifact,
      integrity: `sha256-${'0'.repeat(64)}`,
    }, { throw: true });
    expect(await buildStatus(f.dir.absolute)).to.eql({
      detail: { label: 'build', value: 'dist/ (unavailable: integrity-mismatch)' },
    });
  });

  it('changed local bytes → no misleading build digest', async () => {
    await using f = await fixture();
    await Fs.write(f.dir.join('dist/index.html'), 'changed', { throw: true });
    expect(await buildStatus(f.dir.absolute)).to.eql({
      detail: { label: 'build', value: 'dist/ (unavailable: content-mismatch)' },
    });
  });

  it('different filename selection → no misleading build digest', async () => {
    await using f = await fixture();
    await Fs.writeJson(f.dir.join('artifact.json'), {
      ...f.artifact,
      files: [...f.artifact.files, 'not-selected.js'],
    }, { throw: true });
    expect(await buildStatus(f.dir.absolute)).to.eql({
      detail: { label: 'build', value: 'dist/ (unavailable: selection-mismatch)' },
    });
  });
});

/**
 * Create and pin one real local Dist without credentials or network access.
 */
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
    const artifact = {
      integrity: verified.evidence.integrity,
      files: [...Obj.keys(verified.evidence.dist.hash.parts), 'dist.json'].sort(),
    };
    await Fs.writeJson(dir.join('artifact.json'), artifact, { throw: true });
    return {
      dir,
      artifact,
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
