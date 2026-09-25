import { buildStatus } from '../u.status.ts';
import { describe, expect, expectError, Fs, HashFmt, it, stripAnsi, Text } from './common.ts';
import { shellFixture } from './u.fixture.status.ts';

const PATH = 'dist.private/';

describe('R2 deployment sample: local shell status', () => {
  it('verified projection → renderer-neutral shell digest, not the manifest checksum', async () => {
    await using f = await shellFixture();
    expect(f.digest).not.to.eql(f.pin['dist.json']);
    const { detail } = await buildStatus(f.pin, f.dir.absolute);
    expect(detail).to.eql({
      label: 'shell',
      value: `${PATH} ${stripAnsi(HashFmt.digest(f.digest, { arrow: true }))}`,
    });
  });

  it('caller mutates the pin after invocation → status retains the captured selection', async () => {
    await using f = await shellFixture();
    const pin = { ...f.pin };
    const pending = buildStatus(pin, f.dir.absolute);
    pin['dist.json'] = `sha256-${'0'.repeat(64)}`;
    const captured = await pending;
    const expected = await buildStatus(f.pin, f.dir.absolute);
    expect(captured.detail).to.eql(expected.detail);
  });

  it('terminal presentation → correct file links within the supplied width', async () => {
    await using f = await shellFixture();
    const { detail, formatDetail } = await buildStatus(f.pin, f.dir.absolute);
    if (!formatDetail) throw new Error('Verified status must provide terminal presentation.');
    const manifest = Fs.Path.toFileUrl(f.dir.join(PATH, 'dist.json'));
    const directory = new URL('./', manifest);
    const full = formatDetail({ detail });
    expect(full).to.include(directory.href);
    expect(full).to.include(manifest.href);
    expect(stripAnsi(full ?? '')).to.eql(detail.value);

    // Empty, path-only, and full-detail layouts exercise the sample's allocation boundary.
    expect(formatDetail({ detail, maxWidth: 0 })).to.eql('');
    for (const maxWidth of [10, PATH.length, PATH.length + 1, 80]) {
      const text = formatDetail({ detail, maxWidth }) ?? '';
      expect(Text.Width.measure(text), `width ${maxWidth}`).to.be.at.most(maxWidth);
      expect(text).to.include(directory.href);
      if (maxWidth <= PATH.length + 1) expect(text).not.to.include(manifest.href);
      else expect(text).to.include(manifest.href);
    }
    const other = { ...detail, value: 'different build fact' };
    expect(formatDetail({ detail: other })).to.eql(undefined);
    expect(formatDetail({ detail: { label: 'other', value: detail.value } })).to.eql(undefined);
  });

  describe('unavailable local output', () => {
    for (const kind of ['missing', 'integrity-mismatch', 'content-mismatch']) {
      it(`${kind} → unavailable status rather than a digest`, async () => {
        await using f = await shellFixture();
        const pin = kind === 'integrity-mismatch'
          ? { 'dist.json': `sha256-${'0'.repeat(64)}` }
          : f.pin;
        if (kind === 'missing') await Fs.remove(f.dir.join(PATH));
        if (kind === 'content-mismatch') {
          await Fs.write(f.dir.join(PATH, 'index.html'), 'changed', { throw: true });
        }
        expect(await buildStatus(pin, f.dir.absolute)).to.eql({
          detail: { label: 'shell', value: `${PATH} (unavailable: ${kind})` },
        });
      });
    }

    it('invalid pin → refusal even without local output', async () => {
      await using f = await shellFixture();
      await Fs.remove(f.dir.join(PATH));
      await expectError(
        () => buildStatus({ ...f.pin, 'dist.json': 'invalid' }, f.dir.absolute),
        'Invalid sample Dist pin.',
      );
    });
  });
});
