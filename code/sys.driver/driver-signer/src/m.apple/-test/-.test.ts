import { describe, Err, expect, it } from '../../-test.ts';
import type { t } from '../common.ts';
import { AppleSigner } from '../mod.ts';
import { type RuntimeDeps, run } from '../u.run.ts';

const TEST_IDENTITY = 'Developer ID Application: Example Org (TEAMID1234)';

describe('@sys/driver-signer/apple', () => {
  it('API: exports a signer library surface', async () => {
    const m = await import('@sys/driver-signer/apple');
    expect(m.AppleSigner).to.equal(AppleSigner);
  });

  it('capabilities: truthfully describes the apple signer target', () => {
    const res = AppleSigner.capabilities();

    expect(res.target).to.eql('apple');
    expect(res.sign).to.eql(true);
    expect(res.verify).to.eql(true);
    expect(res.detachedSignature).to.eql(false);
    expect(res.embeddedSignature).to.eql(true);
    expect(res.notarize).to.eql(true);
    expect(res.staple).to.eql(true);
    expect(res.timestamp).to.eql(true);
  });

  describe('mode orchestration', () => {
    it('sign-only → sign', async () => {
      const r = deps();

      const res = await run(
        {
          mode: 'sign-only',
          artifactPath: '/tmp/System.app',
          artifactKind: 'app',
          identity: TEST_IDENTITY,
        },
        r.deps,
      );

      expect(r.calls).to.eql(['sign']);
      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('Expected success result.');
      expect(res.data.signed).to.eql(true);
      expect(res.data.verified).to.eql(false);
      expect(res.data.notarized).to.eql(false);
      expect(res.data.stapled).to.eql(false);
    });

    it('sign-verify → sign → verify', async () => {
      const r = deps();

      const res = await run(
        {
          mode: 'sign-verify',
          artifactPath: '/tmp/System.app',
          artifactKind: 'app',
          identity: TEST_IDENTITY,
        },
        r.deps,
      );

      expect(r.calls).to.eql(['sign', 'verify']);
      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('Expected success result.');
      expect(res.data.signed).to.eql(true);
      expect(res.data.verified).to.eql(true);
      expect(res.data.notarized).to.eql(false);
      expect(res.data.stapled).to.eql(false);
    });

    it('sign-notarize-verify → sign → notarize → staple → verify', async () => {
      const r = deps();

      const res = await run(
        {
          mode: 'sign-notarize-verify',
          artifactPath: '/tmp/System.app',
          artifactKind: 'app',
          identity: TEST_IDENTITY,
          notary: {
            keyId: 'K123456789',
            issuerId: '00000000-0000-0000-0000-000000000000',
            keyP8Path: '/tmp/AuthKey_K123456789.p8',
          },
        },
        r.deps,
      );

      expect(r.calls).to.eql(['sign', 'notarize', 'staple', 'verify']);
      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('Expected success result.');
      expect(res.data.signed).to.eql(true);
      expect(res.data.verified).to.eql(true);
      expect(res.data.notarized).to.eql(true);
      expect(res.data.stapled).to.eql(true);
    });
  });

  describe('input and stage failure mapping', () => {
    it('input: notarize mode requires notary input', async () => {
      const r = deps();

      const res = await run(
        {
          mode: 'sign-notarize-verify',
          artifactPath: '/tmp/System.app',
          artifactKind: 'app',
          identity: TEST_IDENTITY,
        } as t.AppleSigner.RunInput,
        r.deps,
      );

      expect(r.calls).to.eql([]);
      expect(res.ok).to.eql(false);
      if (res.ok) throw new Error('Expected input failure.');
      expect(res.stage).to.eql('input');
      expect(res.code).to.eql('E_INPUT');
    });

    it('maps sign/notarize/staple/verify failures to canonical stage + code', async () => {
      const rows: ReadonlyArray<
        readonly [
          stage: t.AppleSigner.Stage,
          code: t.AppleSigner.ErrorCode,
          mode: t.AppleSigner.Mode,
        ]
      > = [
        ['sign', 'E_SIGN', 'sign-only'],
        ['notarize', 'E_NOTARIZE', 'sign-notarize-verify'],
        ['staple', 'E_STAPLE', 'sign-notarize-verify'],
        ['verify', 'E_VERIFY', 'sign-verify'],
      ];

      for (const [stage, code, mode] of rows) {
        const r = deps({ failAt: stage, code });
        const res = await run(inputFor(mode), r.deps);

        expect(res.ok).to.eql(false);
        if (res.ok) throw new Error(`Expected failure at stage ${stage}.`);
        expect(res.stage).to.eql(stage);
        expect(res.code).to.eql(code);
      }
    });
  });
});

/**
 * Helpers:
 */
function deps(args: { failAt?: t.AppleSigner.Stage; code?: t.AppleSigner.ErrorCode } = {}) {
  const calls: t.AppleSigner.Stage[] = [];

  const injected: RuntimeDeps = {
    exec: async (stage) => {
      calls.push(stage);
      if (args.failAt && stage === args.failAt) {
        return {
          ok: false,
          code: args.code ?? 'E_INTERNAL',
          error: Err.std(`Injected failure at stage: ${stage}`),
        };
      }
      return { ok: true };
    },
  };

  return {
    deps: injected,
    calls,
  };
}

function inputFor(mode: t.AppleSigner.Mode): t.AppleSigner.RunInput {
  if (mode === 'sign-notarize-verify') {
    return {
      mode,
      artifactKind: 'app',
      artifactPath: '/tmp/System.app',
      identity: TEST_IDENTITY,
      notary: {
        keyId: 'K123456789',
        issuerId: '00000000-0000-0000-0000-000000000000',
        keyP8Path: '/tmp/AuthKey_K123456789.p8',
      },
    };
  }

  return {
    mode,
    artifactKind: 'app',
    artifactPath: '/tmp/System.app',
    identity: TEST_IDENTITY,
  };
}
